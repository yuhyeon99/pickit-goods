import { supabase } from '../../../shared/api/supabaseClient';
import type { ClaimMethod, ClaimRequestStatus, DrawResultStatus } from '../../my/model/types';
import type { RewardGrade } from '../../gacha/model/types';
import type { AdminClaimRequest } from '../model/claimTypes';

type MaybeArray<T> = T | T[] | null;

type AdminClaimRow = {
  id: string;
  user_id: string;
  claim_method: ClaimMethod;
  status: ClaimRequestStatus;
  recipient_name: string | null;
  recipient_phone: string | null;
  postal_code: string | null;
  address1: string | null;
  address2: string | null;
  delivery_note: string | null;
  pickup_qr_code: string | null;
  tracking_number: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  profiles: MaybeArray<{
    display_name: string | null;
  }>;
  claim_request_items: Array<{
    id: string;
    draw_results: MaybeArray<{
      id: string;
      grade: RewardGrade;
      status: DrawResultStatus;
      public_verify_code: string;
      created_at: string;
      draw_products: MaybeArray<{
        title: string;
      }>;
      reward_items: MaybeArray<{
        name: string;
        themes: MaybeArray<{
          name: string;
        }>;
      }>;
    }>;
  }>;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getAdminClaimRequests(): Promise<AdminClaimRequest[]> {
  const { data, error } = await supabase
    .from('claim_requests')
    .select(
      `
        id,
        user_id,
        claim_method,
        status,
        recipient_name,
        recipient_phone,
        postal_code,
        address1,
        address2,
        delivery_note,
        pickup_qr_code,
        tracking_number,
        admin_note,
        created_at,
        updated_at,
        completed_at,
        profiles(display_name),
        claim_request_items(
          id,
          draw_results(
            id,
            grade,
            status,
            public_verify_code,
            created_at,
            draw_products(title),
            reward_items(
              name,
              themes(name)
            )
          )
        )
      `,
    )
    .order('created_at', { ascending: false })
    .returns<AdminClaimRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((claim) => ({
    id: claim.id,
    userId: claim.user_id,
    userDisplayName: firstRelation(claim.profiles)?.display_name ?? null,
    claimMethod: claim.claim_method,
    status: claim.status,
    recipientName: claim.recipient_name,
    recipientPhone: claim.recipient_phone,
    postalCode: claim.postal_code,
    address1: claim.address1,
    address2: claim.address2,
    deliveryNote: claim.delivery_note,
    pickupQrCode: claim.pickup_qr_code,
    trackingNumber: claim.tracking_number,
    adminNote: claim.admin_note,
    createdAt: claim.created_at,
    updatedAt: claim.updated_at,
    completedAt: claim.completed_at,
    items: claim.claim_request_items
      .map((item) => {
        const result = firstRelation(item.draw_results);

        if (!result) {
          return null;
        }

        return {
          id: item.id,
          drawResultId: result.id,
          rewardName: firstRelation(result.reward_items)?.name ?? '알 수 없는 상품',
          themeName: firstRelation(firstRelation(result.reward_items)?.themes)?.name ?? null,
          drawProductTitle: firstRelation(result.draw_products)?.title ?? '알 수 없는 가챠',
          grade: result.grade,
          drawResultStatus: result.status,
          publicVerifyCode: result.public_verify_code,
          wonAt: result.created_at,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
  }));
}
