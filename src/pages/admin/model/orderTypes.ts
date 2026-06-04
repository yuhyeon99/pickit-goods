export type OrderStatus = 'pending' | 'paid' | 'canceled' | 'refund_requested' | 'refunded';

export type AdminOrderItem = {
  id: string;
  drawProductId: string;
  drawProductTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  creditAmount: number;
  issuedQuantity: number;
  issuedAt: string | null;
};

export type AdminOrder = {
  id: string;
  userId: string;
  userDisplayName: string | null;
  status: OrderStatus;
  totalAmount: number;
  totalIssuedQuantity: number;
  createdAt: string;
  paidAt: string | null;
  canceledAt: string | null;
  items: AdminOrderItem[];
};

export type AdminOrderFilters = {
  search: string;
  status: OrderStatus | 'all';
};
