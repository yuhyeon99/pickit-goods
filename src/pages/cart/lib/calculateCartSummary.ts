import type { CartItem, CartSummary } from '../model/types';

export function calculateCartSummary(items: CartItem[]): CartSummary {
  return items.reduce<CartSummary>(
    (summary, item) => ({
      totalQuantity: summary.totalQuantity + item.quantity,
      totalAmount: summary.totalAmount + item.lineTotal,
    }),
    { totalQuantity: 0, totalAmount: 0 },
  );
}
