import { supabase } from '../../../shared/api/supabaseClient';
import type { DrawCreditStatus, RefundRequestStatus } from '../../my/api/getMyDrawCredits';
import type { OrderStatus } from '../model/orderTypes';
import type { AdminRefundRequest } from '../model/refundTypes';

type AdminRefundRow = {
  id: string;
  order_id: string | null;
  user_id: string;
  user_draw_credit_id: string;
  reason: string;
  status: RefundRequestStatus;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

type OrderRow = {
  id: string;
  status: OrderStatus;
};

type DrawCreditRow = {
  id: string;
  status: DrawCreditStatus;
  expires_at: string;
  created_at: string;
  draw_product_id: string;
};

type DrawProductRow = {
  id: string;
  title: string;
};

function uniqueValues(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export async function getAdminRefundRequests(): Promise<AdminRefundRequest[]> {
  const { data, error } = await supabase
    .from('refund_requests')
    .select(
      `
        id,
        order_id,
        user_id,
        user_draw_credit_id,
        reason,
        status,
        admin_note,
        requested_at,
        processed_at,
        created_at,
        updated_at
      `,
    )
    .order('requested_at', { ascending: false })
    .limit(200)
    .returns<AdminRefundRow[]>();

  if (error) {
    throw error;
  }

  const refundRequests = data ?? [];
  const userIds = uniqueValues(refundRequests.map((request) => request.user_id));
  const orderIds = uniqueValues(refundRequests.map((request) => request.order_id));
  const creditIds = uniqueValues(refundRequests.map((request) => request.user_draw_credit_id));

  const profilesById = new Map<string, ProfileRow>();
  const ordersById = new Map<string, OrderRow>();
  const creditsById = new Map<string, DrawCreditRow>();
  const drawProductsById = new Map<string, DrawProductRow>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
      .returns<ProfileRow[]>();

    if (profilesError) {
      throw profilesError;
    }

    for (const profile of profiles ?? []) {
      profilesById.set(profile.id, profile);
    }
  }

  if (orderIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status')
      .in('id', orderIds)
      .returns<OrderRow[]>();

    if (ordersError) {
      throw ordersError;
    }

    for (const order of orders ?? []) {
      ordersById.set(order.id, order);
    }
  }

  if (creditIds.length > 0) {
    const { data: credits, error: creditsError } = await supabase
      .from('user_draw_credits')
      .select('id, status, expires_at, created_at, draw_product_id')
      .in('id', creditIds)
      .returns<DrawCreditRow[]>();

    if (creditsError) {
      throw creditsError;
    }

    for (const credit of credits ?? []) {
      creditsById.set(credit.id, credit);
    }

    const drawProductIds = uniqueValues((credits ?? []).map((credit) => credit.draw_product_id));

    if (drawProductIds.length > 0) {
      const { data: drawProducts, error: drawProductsError } = await supabase
        .from('draw_products')
        .select('id, title')
        .in('id', drawProductIds)
        .returns<DrawProductRow[]>();

      if (drawProductsError) {
        throw drawProductsError;
      }

      for (const drawProduct of drawProducts ?? []) {
        drawProductsById.set(drawProduct.id, drawProduct);
      }
    }
  }

  return refundRequests
    .map((request): AdminRefundRequest | null => {
      const profile = profilesById.get(request.user_id);
      const order = request.order_id ? ordersById.get(request.order_id) : null;
      const credit = creditsById.get(request.user_draw_credit_id);

      if (!credit) return null;

      return {
        id: request.id,
        userId: request.user_id,
        userDisplayName: profile?.display_name ?? null,
        userEmail: null,
        orderId: request.order_id,
        orderStatus: order?.status ?? null,
        userDrawCreditId: request.user_draw_credit_id,
        creditStatus: credit.status,
        creditExpiresAt: credit.expires_at,
        creditCreatedAt: credit.created_at,
        drawProductTitle: drawProductsById.get(credit.draw_product_id)?.title ?? '알 수 없는 가챠',
        reason: request.reason,
        status: request.status,
        adminNote: request.admin_note,
        requestedAt: request.requested_at,
        processedAt: request.processed_at,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      };
    })
    .filter((request): request is AdminRefundRequest => Boolean(request));
}
