import { supabase } from '../../../shared/api/supabaseClient';

export async function removeCartItem(cartItemId: string) {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);

  if (error) {
    throw error;
  }
}
