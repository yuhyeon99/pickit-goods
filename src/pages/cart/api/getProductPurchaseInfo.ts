import { supabase } from '../../../shared/api/supabaseClient';
import { calculateRemainingPurchaseQuantity } from '../lib/calculateRemainingPurchaseQuantity';
import type { CartDrawProduct } from '../model/types';
import type { DrawProductScope, DrawProductStatus } from '../../gacha/model/types';

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: DrawProductStatus;
  sales_limit: number;
  sold_count: number;
  scope: DrawProductScope;
  themes: { name: string } | null;
};

type InventoryCountRow = {
  count: number;
};

export async function getProductPurchaseInfo(productId: string): Promise<CartDrawProduct | null> {
  const { data: product, error: productError } = await supabase
    .from('draw_products')
    .select(
      `
        id,
        title,
        description,
        price,
        status,
        sales_limit,
        sold_count,
        scope,
        themes(name)
      `,
    )
    .eq('id', productId)
    .eq('type', 'gacha')
    .maybeSingle()
    .returns<ProductRow | null>();

  if (productError) {
    throw productError;
  }

  if (!product) {
    return null;
  }

  const { count, error: inventoryError } = await supabase
    .from('inventory_units')
    .select('id', { count: 'exact', head: true })
    .eq('draw_product_id', productId)
    .eq('status', 'available')
    .returns<InventoryCountRow[]>();

  if (inventoryError) {
    throw inventoryError;
  }

  const availableInventoryCount = count ?? 0;

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    status: product.status,
    salesLimit: product.sales_limit,
    soldCount: product.sold_count,
    scope: product.scope,
    themeName: product.themes?.name ?? null,
    availableInventoryCount,
    remainingPurchaseQuantity: calculateRemainingPurchaseQuantity(
      product.sales_limit,
      product.sold_count,
      availableInventoryCount,
    ),
  };
}
