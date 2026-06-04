import { supabase } from '../../../shared/api/supabaseClient';

export type CheckoutCartResult = {
  orderId: string;
  totalAmount: number;
  totalQuantity: number;
  issuedCreditCount: number;
};

type CheckoutCartResponse = {
  order_id: string;
  total_amount: number;
  total_quantity: number;
  issued_credit_count: number;
};

export async function checkoutCart(): Promise<CheckoutCartResult> {
  const { data, error } = await supabase.rpc('checkout_cart');

  if (error) {
    throw error;
  }

  const result = data as CheckoutCartResponse;

  return {
    orderId: result.order_id,
    totalAmount: result.total_amount,
    totalQuantity: result.total_quantity,
    issuedCreditCount: result.issued_credit_count,
  };
}
