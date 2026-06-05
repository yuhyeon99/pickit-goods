import { supabase } from '../../../shared/api/supabaseClient';
import type { RefundRequestStatus } from '../../my/api/getMyDrawCredits';
import type { UpdateAdminRefundStatusInput } from '../model/refundTypes';

type UpdateAdminRefundStatusResponse = {
  refund_request_id: string;
  status: RefundRequestStatus;
  user_draw_credit_id: string;
  updated_at: string;
};

export async function updateAdminRefundStatus(input: UpdateAdminRefundStatusInput) {
  const { data, error } = await supabase.rpc('update_refund_request_status', {
    p_refund_request_id: input.refundRequestId,
    p_next_status: input.nextStatus,
    p_admin_note: input.adminNote ?? null,
  });

  if (error) {
    throw error;
  }

  return data as UpdateAdminRefundStatusResponse;
}
