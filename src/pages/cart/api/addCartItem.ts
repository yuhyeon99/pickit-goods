import { supabase } from '../../../shared/api/supabaseClient';
import { getProductPurchaseInfo } from './getProductPurchaseInfo';

type ExistingCartItemRow = {
  id: string;
  quantity: number;
};

export async function addCartItem({
  userId,
  drawProductId,
}: {
  userId: string;
  drawProductId: string;
}) {
  const product = await getProductPurchaseInfo(drawProductId);

  if (!product) {
    throw new Error('가챠 상품을 찾을 수 없습니다.');
  }

  if (product.status !== 'active') {
    throw new Error('현재 신규 구매가 불가능한 상품입니다.');
  }

  if (product.remainingPurchaseQuantity < 1) {
    throw new Error('남은 구매 가능 수량이 없습니다.');
  }

  const { data: existingItem, error: existingError } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('draw_product_id', drawProductId)
    .maybeSingle()
    .returns<ExistingCartItemRow | null>();

  if (existingError) {
    throw existingError;
  }

  if (existingItem) {
    const nextQuantity = existingItem.quantity + 1;

    if (nextQuantity > product.remainingPurchaseQuantity) {
      throw new Error('장바구니 수량이 남은 구매 가능 수량을 초과할 수 없습니다.');
    }

    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: nextQuantity })
      .eq('id', existingItem.id);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await supabase.from('cart_items').insert({
    user_id: userId,
    draw_product_id: drawProductId,
    quantity: 1,
  });

  if (insertError) {
    throw insertError;
  }
}
