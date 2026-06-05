import { supabase } from '../../../shared/api/supabaseClient';
import { getGachaProductDetail } from './getGachaProductDetail';
import type { GachaPlayable } from '../model/types';

type CreditRow = {
  id: string;
};

type RefundRequestRow = {
  user_draw_credit_id: string;
};

export async function getPlayableGacha(productId: string, userId: string): Promise<GachaPlayable | null> {
  const product = await getGachaProductDetail(productId);

  if (!product) {
    return null;
  }

  const [
    { data: credits, error },
    { data: expiredCredits, error: expiredError },
  ] = await Promise.all([
    supabase
      .from('user_draw_credits')
      .select('id')
      .eq('user_id', userId)
      .eq('draw_product_id', productId)
      .eq('type', 'gacha')
      .eq('status', 'unused')
      .gt('expires_at', new Date().toISOString())
      .returns<CreditRow[]>(),
    supabase
      .from('user_draw_credits')
      .select('id')
      .eq('user_id', userId)
      .eq('draw_product_id', productId)
      .eq('type', 'gacha')
      .eq('status', 'unused')
      .lte('expires_at', new Date().toISOString())
      .returns<CreditRow[]>(),
  ]);

  if (error) {
    throw error;
  }

  if (expiredError) {
    throw expiredError;
  }

  const creditIds = (credits ?? []).map((credit) => credit.id);
  let activeRefundCreditIds = new Set<string>();

  if (creditIds.length > 0) {
    const { data: refundRequests, error: refundError } = await supabase
      .from('refund_requests')
      .select('user_draw_credit_id')
      .eq('user_id', userId)
      .in('user_draw_credit_id', creditIds)
      .in('status', ['requested', 'approved', 'processed'])
      .returns<RefundRequestRow[]>();

    if (refundError) {
      throw refundError;
    }

    activeRefundCreditIds = new Set(
      (refundRequests ?? []).map((request) => request.user_draw_credit_id),
    );
  }

  return {
    ...product,
    unusedCreditCount:
      credits?.filter((credit) => !activeRefundCreditIds.has(credit.id)).length ?? 0,
    expiredCreditCount: expiredCredits?.length ?? 0,
  };
}
