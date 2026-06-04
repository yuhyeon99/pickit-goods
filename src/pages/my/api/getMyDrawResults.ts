import { supabase } from '../../../shared/api/supabaseClient';
import type { DrawProductScope } from '../../gacha/model/types';
import type { DrawResultStatus, MyDrawResult } from '../model/types';

type DrawResultRow = {
  id: string;
  draw_product_id: string;
  reward_item_id: string;
  grade: MyDrawResult['grade'];
  status: DrawResultStatus;
  public_verify_code: string;
  created_at: string;
  draw_products: {
    title: string;
    scope: DrawProductScope;
  };
  reward_items: {
    name: string;
    description: string | null;
    category: string;
    themes: { name: string } | null;
  };
};

type ClaimRequestItemRow = {
  draw_result_id: string;
  claim_request_id: string;
  claim_requests: {
    status: MyDrawResult['claimStatus'];
  };
};

export async function getMyDrawResults(userId: string): Promise<MyDrawResult[]> {
  const { data, error } = await supabase
    .from('draw_results')
    .select(
      `
        id,
        draw_product_id,
        reward_item_id,
        grade,
        status,
        public_verify_code,
        created_at,
        draw_products(
          title,
          scope
        ),
        reward_items(
          name,
          description,
          category,
          themes(name)
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<DrawResultRow[]>();

  if (error) {
    throw error;
  }

  const resultIds = (data ?? []).map((result) => result.id);
  const claimMap = new Map<string, { claimRequestId: string; claimStatus: MyDrawResult['claimStatus'] }>();

  if (resultIds.length > 0) {
    const { data: claimItems, error: claimError } = await supabase
      .from('claim_request_items')
      .select(
        `
          draw_result_id,
          claim_request_id,
          claim_requests(status)
        `,
      )
      .in('draw_result_id', resultIds)
      .returns<ClaimRequestItemRow[]>();

    if (claimError) {
      throw claimError;
    }

    for (const claimItem of claimItems ?? []) {
      claimMap.set(claimItem.draw_result_id, {
        claimRequestId: claimItem.claim_request_id,
        claimStatus: claimItem.claim_requests.status,
      });
    }
  }

  return (data ?? []).map((result) => ({
    ...(() => {
      const claim = claimMap.get(result.id);
      return {
        claimRequestId: claim?.claimRequestId ?? null,
        claimStatus: claim?.claimStatus ?? null,
        isClaimRequested: Boolean(claim),
      };
    })(),
    id: result.id,
    drawProductId: result.draw_product_id,
    drawProductTitle: result.draw_products.title,
    drawProductScope: result.draw_products.scope,
    rewardItemId: result.reward_item_id,
    rewardName: result.reward_items.name,
    rewardDescription: result.reward_items.description,
    rewardCategory: result.reward_items.category,
    themeName: result.reward_items.themes?.name ?? null,
    grade: result.grade,
    status: result.status,
    publicVerifyCode: result.public_verify_code,
    createdAt: result.created_at,
  }));
}
