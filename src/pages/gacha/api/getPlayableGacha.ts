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

  const [
    { data: credits, error },
    { data: expiredCredits, error: expiredError },
  ] = await Promise.all([
    supabase
      .from('user_draw_credits')
      .select('id')
      .eq('user_id', userId)
      .eq('draw_product_id', productId)
      .eq('type', 'gacha')
      .eq('status', 'unused')
      .gt('expires_at', new Date().toISOString())
      .returns<CreditRow[]>(),
    supabase
      .from('user_draw_credits')
      .select('id')
      .eq('user_id', userId)
      .eq('draw_product_id', productId)
      .eq('type', 'gacha')
      .eq('status', 'unused')
      .lte('expires_at', new Date().toISOString())
      .returns<CreditRow[]>(),
  ]);

  if (error) {
    throw error;
  }

  if (expiredError) {
    throw expiredError;
  }

  return {
    ...product,
    unusedCreditCount: credits?.length ?? 0,
    expiredCreditCount: expiredCredits?.length ?? 0,
  };
}
