import { supabase } from '../../../shared/api/supabaseClient';
import type { DrawProductScope, DrawProductStatus } from '../../gacha/model/types';

export type DrawCreditStatus = 'unused' | 'used' | 'expired' | 'refunded' | 'failed';
export type RefundRequestStatus = 'requested' | 'approved' | 'rejected' | 'canceled' | 'processed';

export type MyRefundRequest = {
  id: string;
  userDrawCreditId: string;
  status: RefundRequestStatus;
  reason: string;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
};

export type MyDrawCredit = {
  id: string;
  drawProductId: string;
  productTitle: string;
  productStatus: DrawProductStatus;
  productScope: DrawProductScope;
  status: DrawCreditStatus;
  expiresAt: string;
  createdAt: string;
  refundRequest: MyRefundRequest | null;
};

type DrawCreditRow = {
  id: string;
  draw_product_id: string;
  status: DrawCreditStatus;
  expires_at: string;
  created_at: string;
  draw_products: {
    title: string;
    status: DrawProductStatus;
    scope: DrawProductScope;
  };
};

type RefundRequestRow = {
  id: string;
  user_draw_credit_id: string;
  status: RefundRequestStatus;
  reason: string;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
};

export async function getMyDrawCredits(userId: string): Promise<MyDrawCredit[]> {
  const { data, error } = await supabase
    .from('user_draw_credits')
    .select(
      `
        id,
        draw_product_id,
        status,
        expires_at,
        created_at,
        draw_products(
          title,
          status,
          scope
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<DrawCreditRow[]>();

  if (error) {
    throw error;
  }

  const creditIds = (data ?? []).map((credit) => credit.id);
  const refundRequestsByCredit = new Map<string, MyRefundRequest>();

  if (creditIds.length > 0) {
    const { data: refundRequests, error: refundError } = await supabase
      .from('refund_requests')
      .select(
        `
          id,
          user_draw_credit_id,
          status,
          reason,
          admin_note,
          requested_at,
          processed_at
        `,
      )
      .eq('user_id', userId)
      .in('user_draw_credit_id', creditIds)
      .order('requested_at', { ascending: false })
      .returns<RefundRequestRow[]>();

    if (refundError) {
      throw refundError;
    }

    for (const request of refundRequests ?? []) {
      if (!refundRequestsByCredit.has(request.user_draw_credit_id)) {
        refundRequestsByCredit.set(request.user_draw_credit_id, {
          id: request.id,
          userDrawCreditId: request.user_draw_credit_id,
          status: request.status,
          reason: request.reason,
          adminNote: request.admin_note,
          requestedAt: request.requested_at,
          processedAt: request.processed_at,
        });
      }
    }
  }

  return (data ?? []).map((credit) => ({
    id: credit.id,
    drawProductId: credit.draw_product_id,
    productTitle: credit.draw_products.title,
    productStatus: credit.draw_products.status,
    productScope: credit.draw_products.scope,
    status: credit.status,
    expiresAt: credit.expires_at,
    createdAt: credit.created_at,
    refundRequest: refundRequestsByCredit.get(credit.id) ?? null,
  }));
}
