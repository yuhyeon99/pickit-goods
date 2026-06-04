import { supabase } from '../../../shared/api/supabaseClient';
import type { AdminOrder, OrderStatus } from '../model/orderTypes';

type MaybeArray<T> = T | T[] | null;

type OrderRow = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  paid_at: string | null;
  canceled_at: string | null;
  profiles: MaybeArray<{
    display_name: string | null;
  }>;
  order_items: Array<{
    id: string;
    draw_product_id: string;
    quantity: number;
    unit_price: number;
    credit_amount: number;
    draw_products: MaybeArray<{
      title: string;
    }>;
  }>;
};

type CreditIssuanceRow = {
  id: string;
  order_id: string;
  order_item_id: string;
  issued_quantity: number;
  created_at: string;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
        id,
        user_id,
        status,
        total_amount,
        created_at,
        paid_at,
        canceled_at,
        profiles(display_name),
        order_items(
          id,
          draw_product_id,
          quantity,
          unit_price,
          credit_amount,
          draw_products(title)
        )
      `,
    )
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<OrderRow[]>();

  if (error) {
    throw error;
  }

  const orderIds = (orders ?? []).map((order) => order.id);
  const issuancesByOrderItem = new Map<string, CreditIssuanceRow>();

  if (orderIds.length > 0) {
    const { data: issuances, error: issuanceError } = await supabase
      .from('credit_issuances')
      .select('id, order_id, order_item_id, issued_quantity, created_at')
      .in('order_id', orderIds)
      .returns<CreditIssuanceRow[]>();

    if (issuanceError) {
      throw issuanceError;
    }

    for (const issuance of issuances ?? []) {
      issuancesByOrderItem.set(issuance.order_item_id, issuance);
    }
  }

  return (orders ?? []).map((order) => {
    const items = order.order_items.map((item) => {
      const issuance = issuancesByOrderItem.get(item.id);
      const issuedQuantity = issuance?.issued_quantity ?? 0;

      return {
        id: item.id,
        drawProductId: item.draw_product_id,
        drawProductTitle: firstRelation(item.draw_products)?.title ?? '알 수 없는 상품',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.quantity * item.unit_price,
        creditAmount: item.credit_amount,
        issuedQuantity,
        issuedAt: issuance?.created_at ?? null,
      };
    });

    return {
      id: order.id,
      userId: order.user_id,
      userDisplayName: firstRelation(order.profiles)?.display_name ?? null,
      status: order.status,
      totalAmount: order.total_amount,
      totalIssuedQuantity: items.reduce((sum, item) => sum + item.issuedQuantity, 0),
      createdAt: order.created_at,
      paidAt: order.paid_at,
      canceledAt: order.canceled_at,
      items,
    };
  });
}
