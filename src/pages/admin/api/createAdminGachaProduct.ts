import { supabase } from '../../../shared/api/supabaseClient';
import type { AdminGachaProductMutationInput } from '../model/gachaTypes';

export async function createAdminGachaProduct(input: AdminGachaProductMutationInput) {
  const { data, error } = await supabase
    .from('draw_products')
    .insert({
      ...(input.id ? { id: input.id } : {}),
      type: 'gacha',
      scope: 'theme',
      theme_id: input.themeId,
      title: input.title,
      description: input.description,
      thumbnail_url: input.imageUrl,
      price: input.price,
      credit_amount: input.creditAmount,
      sales_limit: input.salesLimit,
      sold_count: 0,
      status: input.status,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
