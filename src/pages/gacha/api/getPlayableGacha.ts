import { supabase } from '../../../shared/api/supabaseClient';
import { getGachaProductDetail } from './getGachaProductDetail';
import type { GachaPlayable } from '../model/types';

type CreditRow = {
  id: string;
};

export async function getPlayableGacha(productId: string, userId: string): Promise<GachaPlayable | null> {
  const product = await getGachaProductDetail(productId);

  if (!product) {
    return null;
  }

  const { data: credits, error } = await supabase
    .from('user_draw_credits')
    .select('id')
    .eq('user_id', userId)
    .eq('draw_product_id', productId)
    .eq('type', 'gacha')
    .eq('status', 'unused')
    .returns<CreditRow[]>();

  if (error) {
    throw error;
  }

  return {
    ...product,
    unusedCreditCount: credits?.length ?? 0,
  };
}
