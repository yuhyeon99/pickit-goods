import { supabase } from '../../../shared/api/supabaseClient';
import type { RefundRequestStatus } from './getMyDrawCredits';

type CreateRefundRequestResponse = {
  refund_request_id: string;
  user_draw_credit_id: string;
  status: RefundRequestStatus;
  requested_at: string;
};

export async function createRefundRequest(input: {
  userDrawCreditId: string;
  reason: string;
}) {
  const { data, error } = await supabase.rpc('create_refund_request', {
    p_user_draw_credit_id: input.userDrawCreditId,
    p_reason: input.reason,
  });

  if (error) {
    throw error;
  }

  return data as CreateRefundRequestResponse;
}
