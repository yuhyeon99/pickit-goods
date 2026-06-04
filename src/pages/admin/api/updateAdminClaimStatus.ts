import { supabase } from '../../../shared/api/supabaseClient';
import type { ClaimMethod, ClaimRequestStatus } from '../../my/model/types';
import type { UpdateAdminClaimStatusInput } from '../model/claimTypes';

type UpdateAdminClaimStatusResponse = {
  claim_request_id: string;
  status: ClaimRequestStatus;
  claim_method: ClaimMethod;
  item_count: number;
  tracking_number: string | null;
  updated_at: string;
};

export async function updateAdminClaimStatus(input: UpdateAdminClaimStatusInput) {
  const { data, error } = await supabase.rpc('update_claim_request_status', {
    p_claim_request_id: input.claimRequestId,
    p_next_status: input.nextStatus,
    p_tracking_number: input.trackingNumber ?? null,
    p_admin_note: input.adminNote ?? null,
  });

  if (error) {
    throw error;
  }

  return data as UpdateAdminClaimStatusResponse;
}
