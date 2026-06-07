import { supabase } from '../../../shared/api/supabaseClient';
import { calculateRemainingPurchaseQuantity } from '../../../shared/lib/calculateRemainingPurchaseQuantity';
import { calculateGradeProbabilities } from '../lib/calculateGradeProbabilities';
import type {
  GachaProduct,
  GachaProductDetail,
  GachaRewardItem,
  GradeCounts,
  RewardGrade,
} from '../model/types';

type DrawProductRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  display_theme_name: string | null;
  price: number;
  status: GachaProduct['status'];
  sales_limit: number;
  sold_count: number;
  scope: GachaProduct['scope'];
  theme_id: string | null;
  themes: { name: string } | null;
};

type DrawProductItemRow = {
  quantity: number;
  reward_items: {
    id: string;
    name: string;
    description: string | null;
    grade: RewardGrade;
    category: string;
    themes: { name: string } | null;
  };
};

type InventoryUnitRow = {
  grade: RewardGrade;
};

const emptyGradeCounts = (): GradeCounts => ({
  S: 0,
  A: 0,
  B: 0,
  C: 0,
});

export async function getGachaProductDetail(
  productId: string,
): Promise<GachaProductDetail | null> {
  const { data: product, error: productError } = await supabase
    .from('draw_products')
    .select(
      `
        id,
        title,
        description,
        thumbnail_url,
        display_theme_name,
        price,
        status,
        sales_limit,
        sold_count,
        scope,
        theme_id,
        themes(name)
      `,
    )
    .eq('id', productId)
    .eq('type', 'gacha')
    .maybeSingle()
    .returns<DrawProductRow | null>();

  if (productError) {
    throw productError;
  }

  if (!product) {
    return null;
  }

  const [{ data: productItems, error: productItemsError }, { data: inventoryUnits, error: inventoryError }] =
    await Promise.all([
      supabase
        .from('draw_product_items')
        .select(
          `
            quantity,
            reward_items(
              id,
              name,
              description,
              grade,
              category,
              themes(name)
            )
          `,
        )
        .eq('draw_product_id', productId)
        .order('quantity', { ascending: false })
        .returns<DrawProductItemRow[]>(),
      supabase
        .from('inventory_units')
        .select('grade')
        .eq('draw_product_id', productId)
        .eq('status', 'available')
        .returns<InventoryUnitRow[]>(),
    ]);

  if (productItemsError) {
    throw productItemsError;
  }

  if (inventoryError) {
    throw inventoryError;
  }

  const availableGradeCounts = emptyGradeCounts();

  for (const unit of inventoryUnits ?? []) {
    availableGradeCounts[unit.grade] += 1;
  }

  const availableInventoryCount = Object.values(availableGradeCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  const rewardItems: GachaRewardItem[] = (productItems ?? []).map((item) => ({
    id: item.reward_items.id,
    name: item.reward_items.name,
    description: item.reward_items.description,
    grade: item.reward_items.grade,
    category: item.reward_items.category,
    themeName: item.reward_items.themes?.name ?? null,
    quantity: item.quantity,
  }));

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    imageUrl: product.thumbnail_url,
    price: product.price,
    status: product.status,
    salesLimit: product.sales_limit,
    soldCount: product.sold_count,
    scope: product.scope,
    themeId: product.theme_id,
    themeName: product.themes?.name ?? product.display_theme_name ?? null,
    availableInventoryCount,
    remainingPurchaseQuantity: calculateRemainingPurchaseQuantity(
      product.sales_limit,
      product.sold_count,
      availableInventoryCount,
    ),
    availableGradeCounts,
    rewardItems,
    gradeProbabilities: calculateGradeProbabilities(
      availableGradeCounts,
      availableInventoryCount,
    ),
  };
}
