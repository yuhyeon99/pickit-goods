import { supabase } from '../../../shared/api/supabaseClient';
import type { DrawProductStatus, RewardGrade } from '../../gacha/model/types';
import type {
  AdminRewardItem,
  AdminRewardPoolItem,
  InventoryStatus,
  InventoryStatusCounts,
} from '../model/rewardItemTypes';

type MaybeArray<T> = T | T[] | null;

type RewardItemRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  grade: RewardGrade;
  category: string;
  status: AdminRewardItem['status'];
  theme_id: string | null;
  created_at: string;
  updated_at: string;
  themes: MaybeArray<{
    name: string;
  }>;
};

type DrawProductItemRow = {
  id: string;
  reward_item_id: string;
  quantity: number;
  draw_products: MaybeArray<{
    id: string;
    title: string;
    status: DrawProductStatus;
    price: number;
    themes: MaybeArray<{
      name: string;
    }>;
  }>;
};

type InventoryUnitRow = {
  reward_item_id: string;
  status: InventoryStatus;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function emptyInventoryCounts(): InventoryStatusCounts {
  return {
    available: 0,
    reserved: 0,
    drawn: 0,
    claimed: 0,
    void: 0,
  };
}

export async function getAdminRewardItems(): Promise<AdminRewardItem[]> {
  const { data: rewardItems, error: rewardItemsError } = await supabase
    .from('reward_items')
    .select(
      `
        id,
        name,
        description,
        image_url,
        grade,
        category,
        status,
        theme_id,
        created_at,
        updated_at,
        themes(name)
      `,
    )
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<RewardItemRow[]>();

  if (rewardItemsError) {
    throw rewardItemsError;
  }

  const rewardItemIds = (rewardItems ?? []).map((item) => item.id);

  if (rewardItemIds.length === 0) {
    return [];
  }

  const [
    { data: productItems, error: productItemsError },
    { data: inventoryUnits, error: inventoryError },
  ] = await Promise.all([
    supabase
      .from('draw_product_items')
      .select(
        `
          id,
          reward_item_id,
          quantity,
          draw_products(
            id,
            title,
            status,
            price,
            themes(name)
          )
        `,
      )
      .in('reward_item_id', rewardItemIds)
      .returns<DrawProductItemRow[]>(),
    supabase
      .from('inventory_units')
      .select('reward_item_id, status')
      .in('reward_item_id', rewardItemIds)
      .returns<InventoryUnitRow[]>(),
  ]);

  if (productItemsError) {
    throw productItemsError;
  }

  if (inventoryError) {
    throw inventoryError;
  }

  const poolsByRewardItem = new Map<string, AdminRewardPoolItem[]>();
  const inventoryCountsByRewardItem = new Map<string, InventoryStatusCounts>();

  for (const itemId of rewardItemIds) {
    poolsByRewardItem.set(itemId, []);
    inventoryCountsByRewardItem.set(itemId, emptyInventoryCounts());
  }

  for (const poolItem of productItems ?? []) {
    const drawProduct = firstRelation(poolItem.draw_products);
    if (!drawProduct) continue;

    const currentItems = poolsByRewardItem.get(poolItem.reward_item_id) ?? [];
    currentItems.push({
      id: poolItem.id,
      drawProductId: drawProduct.id,
      drawProductTitle: drawProduct.title,
      drawProductStatus: drawProduct.status,
      drawProductPrice: drawProduct.price,
      drawProductThemeName: firstRelation(drawProduct.themes)?.name ?? null,
      quantity: poolItem.quantity,
    });
    poolsByRewardItem.set(poolItem.reward_item_id, currentItems);
  }

  for (const unit of inventoryUnits ?? []) {
    const counts = inventoryCountsByRewardItem.get(unit.reward_item_id);
    if (!counts) continue;
    counts[unit.status] += 1;
  }

  return (rewardItems ?? []).map((item) => {
    const inventoryCounts = inventoryCountsByRewardItem.get(item.id) ?? emptyInventoryCounts();

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.image_url,
      grade: item.grade,
      category: item.category,
      status: item.status,
      themeId: item.theme_id,
      themeName: firstRelation(item.themes)?.name ?? null,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      inventoryCounts,
      totalInventoryCount: Object.values(inventoryCounts).reduce((sum, count) => sum + count, 0),
      poolItems: poolsByRewardItem.get(item.id) ?? [],
    };
  });
}
