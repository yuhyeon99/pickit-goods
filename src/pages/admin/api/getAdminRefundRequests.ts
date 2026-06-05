import { supabase } from '../../../shared/api/supabaseClient';
import type { DrawCreditStatus, RefundRequestStatus } from '../../my/api/getMyDrawCredits';
import type { AdminRefundRequest } from '../model/refundTypes';

type MaybeArray<T> = T | T[] | null;

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
  profiles: MaybeArray<{
    display_name: string | null;
    email: string | null;
  }>;
  orders: MaybeArray<{
    id: string;
    status: string;
  }>;
  user_draw_credits: MaybeArray<{
    id: string;
    status: DrawCreditStatus;
    expires_at: string;
    created_at: string;
    draw_products: MaybeArray<{
      title: string;
    }>;
  }>;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
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
        updated_at,
        profiles(display_name, email),
        orders(id, status),
        user_draw_credits(
          id,
          status,
          expires_at,
          created_at,
          draw_products(title)
        )
      `,
    )
    .order('requested_at', { ascending: false })
    .limit(200)
    .returns<AdminRefundRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((request) => {
      const profile = firstRelation(request.profiles);
      const order = firstRelation(request.orders);
      const credit = firstRelation(request.user_draw_credits);

      if (!credit) {
        return null;
      }

      return {
        id: request.id,
        userId: request.user_id,
        userDisplayName: profile?.display_name ?? null,
        userEmail: profile?.email ?? null,
        orderId: request.order_id,
        orderStatus: order?.status ?? null,
        userDrawCreditId: request.user_draw_credit_id,
        creditStatus: credit.status,
        creditExpiresAt: credit.expires_at,
        creditCreatedAt: credit.created_at,
        drawProductTitle: firstRelation(credit.draw_products)?.title ?? '알 수 없는 가챠',
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
