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

  return (data ?? []).map((result) => ({
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
