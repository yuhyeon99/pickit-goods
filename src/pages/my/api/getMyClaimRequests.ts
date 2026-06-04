import { supabase } from '../../../shared/api/supabaseClient';
import type { ClaimMethod, ClaimRequestStatus, MyClaimRequest } from '../model/types';

type ClaimRequestRow = {
  id: string;
  claim_method: ClaimMethod;
  status: ClaimRequestStatus;
  pickup_qr_code: string | null;
  created_at: string;
  claim_request_items: { id: string }[];
};

export async function getMyClaimRequests(userId: string): Promise<MyClaimRequest[]> {
  const { data, error } = await supabase
    .from('claim_requests')
    .select(
      `
        id,
        claim_method,
        status,
        pickup_qr_code,
        created_at,
        claim_request_items(id)
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<ClaimRequestRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((claim) => ({
    id: claim.id,
    claimMethod: claim.claim_method,
    status: claim.status,
    itemCount: claim.claim_request_items?.length ?? 0,
    pickupQrCode: claim.pickup_qr_code,
    createdAt: claim.created_at,
  }));
}
