import { supabase } from '../../../shared/api/supabaseClient';
import type { AdminGachaProductMutationInput } from '../model/gachaTypes';

export type UpdateAdminGachaProductInput = AdminGachaProductMutationInput & {
  id: string;
};

export async function updateAdminGachaProduct(input: UpdateAdminGachaProductInput) {
  const { data, error } = await supabase
    .from('draw_products')
    .update({
      title: input.title,
      theme_id: input.themeId,
      description: input.description,
      thumbnail_url: input.imageUrl,
      price: input.price,
      credit_amount: input.creditAmount,
      sales_limit: input.salesLimit,
      status: input.status,
    })
    .eq('id', input.id)
    .eq('type', 'gacha')
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
