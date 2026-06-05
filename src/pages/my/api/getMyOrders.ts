import { supabase } from '../../../shared/api/supabaseClient';
import type {
  MyOrder,
  MyOrderCreditSummary,
  MyOrderRefundRequest,
  MyOrderStatus,
} from '../model/types';
import type { DrawCreditStatus, RefundRequestStatus } from './getMyDrawCredits';

type MaybeArray<T> = T | T[] | null;

type OrderRow = {
  id: string;
  status: MyOrderStatus;
  total_amount: number;
  created_at: string;
  paid_at: string | null;
  canceled_at: string | null;
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
  order_id: string;
  order_item_id: string;
  issued_quantity: number;
  created_at: string;
};

type CreditRow = {
  order_id: string | null;
  status: DrawCreditStatus;
};

type RefundRequestRow = {
  id: string;
  order_id: string | null;
  status: RefundRequestStatus;
  requested_at: string;
  processed_at: string | null;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function createEmptyCreditSummary(): MyOrderCreditSummary {
  return {
    total: 0,
    unused: 0,
    used: 0,
    expired: 0,
    refunded: 0,
    failed: 0,
  };
}

export async function getMyOrders(userId: string): Promise<MyOrder[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
        id,
        status,
        total_amount,
        created_at,
        paid_at,
        canceled_at,
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
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<OrderRow[]>();

  if (error) {
    throw error;
  }

  const orderIds = (orders ?? []).map((order) => order.id);
  const issuancesByOrderItem = new Map<string, CreditIssuanceRow>();
  const creditSummaryByOrder = new Map<string, MyOrderCreditSummary>();
  const refundRequestsByOrder = new Map<string, MyOrderRefundRequest[]>();

  if (orderIds.length > 0) {
    const [
      { data: issuances, error: issuanceError },
      { data: credits, error: creditError },
      { data: refundRequests, error: refundError },
    ] = await Promise.all([
      supabase
        .from('credit_issuances')
        .select('order_id, order_item_id, issued_quantity, created_at')
        .in('order_id', orderIds)
        .returns<CreditIssuanceRow[]>(),
      supabase
        .from('user_draw_credits')
        .select('order_id, status')
        .in('order_id', orderIds)
        .returns<CreditRow[]>(),
      supabase
        .from('refund_requests')
        .select('id, order_id, status, requested_at, processed_at')
        .in('order_id', orderIds)
        .order('requested_at', { ascending: false })
        .returns<RefundRequestRow[]>(),
    ]);

    if (issuanceError) throw issuanceError;
    if (creditError) throw creditError;
    if (refundError) throw refundError;

    for (const issuance of issuances ?? []) {
      issuancesByOrderItem.set(issuance.order_item_id, issuance);
    }

    for (const credit of credits ?? []) {
      if (!credit.order_id) continue;
      const summary = creditSummaryByOrder.get(credit.order_id) ?? createEmptyCreditSummary();
      summary.total += 1;
      summary[credit.status] += 1;
      creditSummaryByOrder.set(credit.order_id, summary);
    }

    for (const request of refundRequests ?? []) {
      if (!request.order_id) continue;
      const current = refundRequestsByOrder.get(request.order_id) ?? [];
      current.push({
        id: request.id,
        status: request.status,
        requestedAt: request.requested_at,
        processedAt: request.processed_at,
      });
      refundRequestsByOrder.set(request.order_id, current);
    }
  }

  return (orders ?? []).map((order) => {
    const items = order.order_items.map((item) => {
      const issuance = issuancesByOrderItem.get(item.id);

      return {
        id: item.id,
        drawProductTitle: firstRelation(item.draw_products)?.title ?? '알 수 없는 상품',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.quantity * item.unit_price,
        creditAmount: item.credit_amount,
        issuedQuantity: issuance?.issued_quantity ?? 0,
        issuedAt: issuance?.created_at ?? null,
      };
    });

    return {
      id: order.id,
      status: order.status,
      totalAmount: order.total_amount,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      canceledAt: order.canceled_at,
      totalIssuedQuantity: items.reduce((sum, item) => sum + item.issuedQuantity, 0),
      creditSummary: creditSummaryByOrder.get(order.id) ?? createEmptyCreditSummary(),
      items,
      refundRequests: refundRequestsByOrder.get(order.id) ?? [],
    };
  });
}
