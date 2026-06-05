import { supabase } from '../../../shared/api/supabaseClient';
import type { RefundRequestStatus } from './getMyDrawCredits';

type CancelRefundRequestResponse = {
  refund_request_id: string;
  status: RefundRequestStatus;
  updated_at: string;
};

export async function cancelRefundRequest(refundRequestId: string) {
  const { data, error } = await supabase.rpc('cancel_refund_request', {
    p_refund_request_id: refundRequestId,
  });

  if (error) {
    throw error;
  }

  return data as CancelRefundRequestResponse;
}
