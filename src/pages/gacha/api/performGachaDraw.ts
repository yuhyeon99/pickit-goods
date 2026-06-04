import { supabase } from '../../../shared/api/supabaseClient';
import type { GachaDrawResult } from '../model/types';

type DrawGachaResponse = {
  draw_result_id: string;
  draw_credit_id: string;
  draw_product_id: string;
  inventory_unit_id: string;
  reward_item_id: string;
  reward_name: string;
  reward_description: string | null;
  reward_grade: GachaDrawResult['rewardGrade'];
  reward_category: string;
  theme_name: string | null;
  public_verify_code: string;
  request_id: string;
  created_at: string;
};

export async function performGachaDraw(drawProductId: string): Promise<GachaDrawResult> {
  const { data, error } = await supabase.rpc('draw_gacha', {
    p_draw_product_id: drawProductId,
  });

  if (error) {
    throw error;
  }

  const result = data as DrawGachaResponse;

  return {
    drawResultId: result.draw_result_id,
    drawCreditId: result.draw_credit_id,
    drawProductId: result.draw_product_id,
    inventoryUnitId: result.inventory_unit_id,
    rewardItemId: result.reward_item_id,
    rewardName: result.reward_name,
    rewardDescription: result.reward_description,
    rewardGrade: result.reward_grade,
    rewardCategory: result.reward_category,
    themeName: result.theme_name,
    publicVerifyCode: result.public_verify_code,
    requestId: result.request_id,
    createdAt: result.created_at,
  };
}
