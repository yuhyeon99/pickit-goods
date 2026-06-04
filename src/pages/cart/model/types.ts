import type { DrawProductScope, DrawProductStatus } from '../../gacha/model/types';

export type CartDrawProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: DrawProductStatus;
  salesLimit: number;
  soldCount: number;
  scope: DrawProductScope;
  themeName: string | null;
  availableInventoryCount: number;
  remainingPurchaseQuantity: number;
};

export type CartItem = {
  id: string;
  userId: string;
  drawProductId: string;
  quantity: number;
  product: CartDrawProduct;
  lineTotal: number;
};

export type CartSummary = {
  totalQuantity: number;
  totalAmount: number;
};
