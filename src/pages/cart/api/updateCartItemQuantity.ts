import { supabase } from '../../../shared/api/supabaseClient';
import { getProductPurchaseInfo } from './getProductPurchaseInfo';

type CartItemProductRow = {
  draw_product_id: string;
};

export async function updateCartItemQuantity({
  cartItemId,
  quantity,
}: {
  cartItemId: string;
  quantity: number;
}) {
  if (quantity < 1) {
    throw new Error('장바구니 수량은 1 이상이어야 합니다.');
  }

  const { data: cartItem, error: cartItemError } = await supabase
    .from('cart_items')
    .select('draw_product_id')
    .eq('id', cartItemId)
    .maybeSingle()
    .returns<CartItemProductRow | null>();

  if (cartItemError) {
    throw cartItemError;
  }

  if (!cartItem) {
    throw new Error('장바구니 항목을 찾을 수 없습니다.');
  }

  const product = await getProductPurchaseInfo(cartItem.draw_product_id);

  if (!product) {
    throw new Error('가챠 상품을 찾을 수 없습니다.');
  }

  if (product.status !== 'active') {
    throw new Error('현재 신규 구매가 불가능한 상품입니다.');
  }

  if (quantity > product.remainingPurchaseQuantity) {
    throw new Error('장바구니 수량이 남은 구매 가능 수량을 초과할 수 없습니다.');
  }

  const { error: updateError } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);

  if (updateError) {
    throw updateError;
  }
}
