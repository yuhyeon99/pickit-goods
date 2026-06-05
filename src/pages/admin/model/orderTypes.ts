import type { CreditStatus } from './userTypes';
import type { RefundRequestStatus } from '../../my/api/getMyDrawCredits';

export type OrderStatus = 'pending' | 'paid' | 'canceled' | 'refund_requested' | 'refunded';

export type AdminOrderCreditSummary = Record<CreditStatus, number> & {
  total: number;
};

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
  creditSummary: AdminOrderCreditSummary;
  refundRequests: AdminOrderRefundRequest[];
  items: AdminOrderItem[];
};

export type AdminOrderRefundRequest = {
  id: string;
  status: RefundRequestStatus;
  requestedAt: string;
  processedAt: string | null;
};

export type AdminOrderFilters = {
  search: string;
  status: OrderStatus | 'all';
};
