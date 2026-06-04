import { supabase } from '../../../shared/api/supabaseClient';
import { calculateRemainingPurchaseQuantity } from '../lib/calculateRemainingPurchaseQuantity';
import type { CartItem } from '../model/types';
import type { DrawProductScope, DrawProductStatus } from '../../gacha/model/types';

type CartItemRow = {
  id: string;
  user_id: string;
  draw_product_id: string;
  quantity: number;
  draw_products: {
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
};

type InventoryUnitRow = {
  draw_product_id: string;
};

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const { data: rows, error } = await supabase
    .from('cart_items')
    .select(
      `
        id,
        user_id,
        draw_product_id,
        quantity,
        draw_products(
          id,
          title,
          description,
          price,
          status,
          sales_limit,
          sold_count,
          scope,
          themes(name)
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<CartItemRow[]>();

  if (error) {
    throw error;
  }

  const productIds = [...new Set((rows ?? []).map((row) => row.draw_product_id))];
  const availableCounts = new Map<string, number>();

  if (productIds.length > 0) {
    const { data: inventoryUnits, error: inventoryError } = await supabase
      .from('inventory_units')
      .select('draw_product_id')
      .in('draw_product_id', productIds)
      .eq('status', 'available')
      .returns<InventoryUnitRow[]>();

    if (inventoryError) {
      throw inventoryError;
    }

    for (const unit of inventoryUnits ?? []) {
      availableCounts.set(unit.draw_product_id, (availableCounts.get(unit.draw_product_id) ?? 0) + 1);
    }
  }

  return (rows ?? []).map((row) => {
    const availableInventoryCount = availableCounts.get(row.draw_product_id) ?? 0;
    const remainingPurchaseQuantity = calculateRemainingPurchaseQuantity(
      row.draw_products.sales_limit,
      row.draw_products.sold_count,
      availableInventoryCount,
    );

    return {
      id: row.id,
      userId: row.user_id,
      drawProductId: row.draw_product_id,
      quantity: row.quantity,
      lineTotal: row.quantity * row.draw_products.price,
      product: {
        id: row.draw_products.id,
        title: row.draw_products.title,
        description: row.draw_products.description,
        price: row.draw_products.price,
        status: row.draw_products.status,
        salesLimit: row.draw_products.sales_limit,
        soldCount: row.draw_products.sold_count,
        scope: row.draw_products.scope,
        themeName: row.draw_products.themes?.name ?? null,
        availableInventoryCount,
        remainingPurchaseQuantity,
      },
    };
  });
}
