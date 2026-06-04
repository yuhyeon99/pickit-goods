import { supabase } from '../../../shared/api/supabaseClient';
import { calculateGradeProbabilities } from '../../gacha/lib/calculateGradeProbabilities';
import type {
  DrawProductScope,
  DrawProductStatus,
  GradeCounts,
  RewardGrade,
} from '../../gacha/model/types';
import type { AdminGachaProduct, AdminGachaRewardItem } from '../model/gachaTypes';

type MaybeArray<T> = T | T[] | null;

type DrawProductRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: DrawProductStatus;
  scope: DrawProductScope;
  theme_id: string | null;
  sales_limit: number;
  sold_count: number;
  created_at: string;
  themes: MaybeArray<{
    name: string;
  }>;
};

type InventoryUnitRow = {
  draw_product_id: string;
  grade: RewardGrade;
};

type DrawProductItemRow = {
  draw_product_id: string;
  quantity: number;
  reward_items: MaybeArray<{
    id: string;
    name: string;
    grade: RewardGrade;
    themes: MaybeArray<{
      name: string;
    }>;
  }>;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function emptyGradeCounts(): GradeCounts {
  return {
    S: 0,
    A: 0,
    B: 0,
    C: 0,
  };
}

export async function getAdminGachaProducts(): Promise<AdminGachaProduct[]> {
  const { data: products, error: productsError } = await supabase
    .from('draw_products')
    .select(
      `
        id,
        title,
        description,
        price,
        status,
        scope,
        theme_id,
        sales_limit,
        sold_count,
        created_at,
        themes(name)
      `,
    )
    .eq('type', 'gacha')
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<DrawProductRow[]>();

  if (productsError) {
    throw productsError;
  }

  const productIds = (products ?? []).map((product) => product.id);

  if (productIds.length === 0) {
    return [];
  }

  const [
    { data: inventoryUnits, error: inventoryError },
    { data: productItems, error: productItemsError },
  ] = await Promise.all([
    supabase
      .from('inventory_units')
      .select('draw_product_id, grade')
      .eq('status', 'available')
      .in('draw_product_id', productIds)
      .returns<InventoryUnitRow[]>(),
    supabase
      .from('draw_product_items')
      .select(
        `
          draw_product_id,
          quantity,
          reward_items(
            id,
            name,
            grade,
            themes(name)
          )
        `,
      )
      .in('draw_product_id', productIds)
      .order('quantity', { ascending: false })
      .returns<DrawProductItemRow[]>(),
  ]);

  if (inventoryError) {
    throw inventoryError;
  }

  if (productItemsError) {
    throw productItemsError;
  }

  const inventoryByProduct = new Map<string, GradeCounts>();
  const rewardItemsByProduct = new Map<string, AdminGachaRewardItem[]>();

  for (const productId of productIds) {
    inventoryByProduct.set(productId, emptyGradeCounts());
    rewardItemsByProduct.set(productId, []);
  }

  for (const unit of inventoryUnits ?? []) {
    const counts = inventoryByProduct.get(unit.draw_product_id);
    if (!counts) continue;
    counts[unit.grade] += 1;
  }

  for (const item of productItems ?? []) {
    const rewardItem = firstRelation(item.reward_items);
    if (!rewardItem) continue;

    const currentItems = rewardItemsByProduct.get(item.draw_product_id) ?? [];
    currentItems.push({
      id: rewardItem.id,
      name: rewardItem.name,
      grade: rewardItem.grade,
      themeName: firstRelation(rewardItem.themes)?.name ?? null,
      quantity: item.quantity,
    });
    rewardItemsByProduct.set(item.draw_product_id, currentItems);
  }

  return (products ?? []).map((product) => {
    const gradeCounts = inventoryByProduct.get(product.id) ?? emptyGradeCounts();
    const availableInventoryCount = Object.values(gradeCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    const remainingPurchaseQuantity = Math.max(
      0,
      Math.min(product.sales_limit - product.sold_count, availableInventoryCount),
    );

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      status: product.status,
      scope: product.scope,
      themeId: product.theme_id,
      themeName: firstRelation(product.themes)?.name ?? null,
      salesLimit: product.sales_limit,
      soldCount: product.sold_count,
      remainingPurchaseQuantity,
      availableInventoryCount,
      availableGradeCounts: gradeCounts,
      gradeProbabilities: calculateGradeProbabilities(gradeCounts, availableInventoryCount),
      rewardItems: rewardItemsByProduct.get(product.id) ?? [],
      createdAt: product.created_at,
    };
  });
}
