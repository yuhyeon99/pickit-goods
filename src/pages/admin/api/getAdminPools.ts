import { supabase } from '../../../shared/api/supabaseClient';
import type {
  DrawProductScope,
  DrawProductStatus,
  RewardGrade,
} from '../../gacha/model/types';
import {
  calculatePoolGradeStats,
  createEmptyGradeCounts,
  createEmptyInventoryCounts,
  incrementInventoryStatus,
  sumInventoryCounts,
} from '../lib/poolConsistency';
import type { InventoryStatus, InventoryStatusCounts } from '../model/rewardItemTypes';
import type { AdminPool, AdminPoolItem, PoolInventoryAccumulator } from '../model/poolTypes';

type MaybeArray<T> = T | T[] | null;

type DrawProductRow = {
  id: string;
  title: string;
  type: AdminPool['type'];
  status: DrawProductStatus;
  scope: DrawProductScope;
  price: number;
  theme_id: string | null;
  sales_limit: number;
  sold_count: number;
  created_at: string;
  themes: MaybeArray<{
    name: string;
  }>;
};

type DrawProductItemRow = {
  id: string;
  draw_product_id: string;
  reward_item_id: string;
  quantity: number;
  reward_items: MaybeArray<{
    name: string;
    grade: RewardGrade;
    themes: MaybeArray<{
      name: string;
    }>;
  }>;
};

type InventoryUnitRow = {
  draw_product_id: string;
  reward_item_id: string;
  grade: RewardGrade;
  status: InventoryStatus;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function createAccumulator(): PoolInventoryAccumulator {
  return {
    total: 0,
    byStatus: createEmptyInventoryCounts(),
    byGrade: createEmptyGradeCounts(),
    availableByGrade: createEmptyGradeCounts(),
  };
}

export async function getAdminPools(): Promise<AdminPool[]> {
  const { data: products, error: productsError } = await supabase
    .from('draw_products')
    .select(
      `
        id,
        title,
        type,
        status,
        scope,
        price,
        theme_id,
        sales_limit,
        sold_count,
        created_at,
        themes(name)
      `,
    )
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
    { data: productItems, error: productItemsError },
    { data: inventoryUnits, error: inventoryError },
  ] = await Promise.all([
    supabase
      .from('draw_product_items')
      .select(
        `
          id,
          draw_product_id,
          reward_item_id,
          quantity,
          reward_items(
            name,
            grade,
            themes(name)
          )
        `,
      )
      .in('draw_product_id', productIds)
      .order('quantity', { ascending: false })
      .returns<DrawProductItemRow[]>(),
    supabase
      .from('inventory_units')
      .select('draw_product_id, reward_item_id, grade, status')
      .in('draw_product_id', productIds)
      .returns<InventoryUnitRow[]>(),
  ]);

  if (productItemsError) {
    throw productItemsError;
  }

  if (inventoryError) {
    throw inventoryError;
  }

  const poolItemsByProduct = new Map<string, DrawProductItemRow[]>();
  const inventoryByProduct = new Map<string, PoolInventoryAccumulator>();
  const inventoryByProductReward = new Map<string, InventoryStatusCounts>();

  for (const productId of productIds) {
    poolItemsByProduct.set(productId, []);
    inventoryByProduct.set(productId, createAccumulator());
  }

  for (const item of productItems ?? []) {
    const currentItems = poolItemsByProduct.get(item.draw_product_id) ?? [];
    currentItems.push(item);
    poolItemsByProduct.set(item.draw_product_id, currentItems);
  }

  for (const unit of inventoryUnits ?? []) {
    const productAccumulator = inventoryByProduct.get(unit.draw_product_id);

    if (productAccumulator) {
      productAccumulator.total += 1;
      incrementInventoryStatus(productAccumulator.byStatus, unit.status);
      productAccumulator.byGrade[unit.grade] += 1;
      if (unit.status === 'available') {
        productAccumulator.availableByGrade[unit.grade] += 1;
      }
    }

    const productRewardKey = `${unit.draw_product_id}:${unit.reward_item_id}`;
    const rewardCounts = inventoryByProductReward.get(productRewardKey) ?? createEmptyInventoryCounts();
    incrementInventoryStatus(rewardCounts, unit.status);
    inventoryByProductReward.set(productRewardKey, rewardCounts);
  }

  return (products ?? []).map((product) => {
    const productInventory = inventoryByProduct.get(product.id) ?? createAccumulator();
    const poolItems: AdminPoolItem[] = (poolItemsByProduct.get(product.id) ?? []).map((item) => {
      const rewardItem = firstRelation(item.reward_items);
      const inventoryCounts =
        inventoryByProductReward.get(`${item.draw_product_id}:${item.reward_item_id}`) ??
        createEmptyInventoryCounts();
      const actualInventoryCount = sumInventoryCounts(inventoryCounts);

      return {
        id: item.id,
        rewardItemId: item.reward_item_id,
        rewardItemName: rewardItem?.name ?? '알 수 없는 상품',
        rewardItemThemeName: firstRelation(rewardItem?.themes ?? null)?.name ?? null,
        grade: rewardItem?.grade ?? 'C',
        configuredQuantity: item.quantity,
        actualInventoryCount,
        inventoryCounts,
        isQuantityMatched: item.quantity === actualInventoryCount,
      };
    });

    return {
      id: product.id,
      title: product.title,
      type: product.type,
      status: product.status,
      scope: product.scope,
      price: product.price,
      themeId: product.theme_id,
      themeName: firstRelation(product.themes)?.name ?? null,
      salesLimit: product.sales_limit,
      soldCount: product.sold_count,
      availableInventoryCount: productInventory.byStatus.available,
      totalInventoryCount: productInventory.total,
      hasMismatch: poolItems.some((item) => !item.isQuantityMatched),
      gradeStats: calculatePoolGradeStats(
        productInventory.byGrade,
        productInventory.availableByGrade,
      ),
      poolItems,
      createdAt: product.created_at,
    };
  });
}
