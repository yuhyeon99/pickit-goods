import { supabase } from '../../../shared/api/supabaseClient';
import type { DrawProductScope, DrawProductStatus } from '../../gacha/model/types';

export type DrawCreditStatus = 'unused' | 'used' | 'expired' | 'refunded' | 'failed';

export type MyDrawCredit = {
  id: string;
  drawProductId: string;
  productTitle: string;
  productStatus: DrawProductStatus;
  productScope: DrawProductScope;
  status: DrawCreditStatus;
  createdAt: string;
};

type DrawCreditRow = {
  id: string;
  draw_product_id: string;
  status: DrawCreditStatus;
  created_at: string;
  draw_products: {
    title: string;
    status: DrawProductStatus;
    scope: DrawProductScope;
  };
};

export async function getMyDrawCredits(userId: string): Promise<MyDrawCredit[]> {
  const { data, error } = await supabase
    .from('user_draw_credits')
    .select(
      `
        id,
        draw_product_id,
        status,
        created_at,
        draw_products(
          title,
          status,
          scope
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<DrawCreditRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((credit) => ({
    id: credit.id,
    drawProductId: credit.draw_product_id,
    productTitle: credit.draw_products.title,
    productStatus: credit.draw_products.status,
    productScope: credit.draw_products.scope,
    status: credit.status,
    createdAt: credit.created_at,
  }));
}
