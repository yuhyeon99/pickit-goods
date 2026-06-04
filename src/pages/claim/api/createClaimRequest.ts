import { supabase } from '../../../shared/api/supabaseClient';
import type { ClaimMethod, ClaimRequestStatus } from '../../my/model/types';

export type CreateClaimRequestInput = {
  drawResultIds: string[];
  claimMethod: ClaimMethod;
  recipientName?: string;
  recipientPhone?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  deliveryNote?: string;
};

export type CreateClaimRequestResult = {
  claimRequestId: string;
  claimMethod: ClaimMethod;
  status: ClaimRequestStatus;
  itemCount: number;
  pickupQrCode: string | null;
  createdAt: string;
};

type CreateClaimRequestResponse = {
  claim_request_id: string;
  claim_method: ClaimMethod;
  status: ClaimRequestStatus;
  item_count: number;
  pickup_qr_code: string | null;
  created_at: string;
};

export async function createClaimRequest(
  input: CreateClaimRequestInput,
): Promise<CreateClaimRequestResult> {
  const { data, error } = await supabase.rpc('create_claim_request', {
    p_draw_result_ids: input.drawResultIds,
    p_claim_method: input.claimMethod,
    p_recipient_name: input.recipientName ?? null,
    p_recipient_phone: input.recipientPhone ?? null,
    p_postal_code: input.postalCode ?? null,
    p_address1: input.address1 ?? null,
    p_address2: input.address2 ?? null,
    p_delivery_note: input.deliveryNote ?? null,
  });

  if (error) {
    throw error;
  }

  const result = data as CreateClaimRequestResponse;

  return {
    claimRequestId: result.claim_request_id,
    claimMethod: result.claim_method,
    status: result.status,
    itemCount: result.item_count,
    pickupQrCode: result.pickup_qr_code,
    createdAt: result.created_at,
  };
}
