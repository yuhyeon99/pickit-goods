import { supabase } from '../../../shared/api/supabaseClient';
import { calculateRemainingPurchaseQuantity } from '../../../shared/lib/calculateRemainingPurchaseQuantity';
import type { GachaProduct, GradeCounts, RewardGrade } from '../model/types';

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

type InventoryUnitRow = {
  draw_product_id: string;
  grade: RewardGrade;
};

const emptyGradeCounts = (): GradeCounts => ({
  S: 0,
  A: 0,
  B: 0,
  C: 0,
});

export async function getGachaProducts(): Promise<GachaProduct[]> {
  const { data: products, error: productsError } = await supabase
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
    .eq('type', 'gacha')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .returns<DrawProductRow[]>();

  if (productsError) {
    throw productsError;
  }

  if (!products || products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const { data: inventoryUnits, error: inventoryError } = await supabase
    .from('inventory_units')
    .select('draw_product_id, grade')
    .eq('status', 'available')
    .in('draw_product_id', productIds)
    .returns<InventoryUnitRow[]>();

  if (inventoryError) {
    throw inventoryError;
  }

  const inventoryByProduct = new Map<string, GradeCounts>();

  for (const productId of productIds) {
    inventoryByProduct.set(productId, emptyGradeCounts());
  }

  for (const unit of inventoryUnits ?? []) {
    const counts = inventoryByProduct.get(unit.draw_product_id);
    if (!counts) continue;
    counts[unit.grade] += 1;
  }

  return products.map((product) => {
    const gradeCounts = inventoryByProduct.get(product.id) ?? emptyGradeCounts();
    const availableInventoryCount = Object.values(gradeCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

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
      availableGradeCounts: gradeCounts,
    };
  });
}
