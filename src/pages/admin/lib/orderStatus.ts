import type { OrderStatus } from '../model/orderTypes';

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  canceled: '취소됨',
  refund_requested: '환불 요청',
  refunded: '환불 완료',
};

export function getOrderStatusTone(status: OrderStatus) {
  switch (status) {
    case 'paid':
      return 'success';
    case 'refund_requested':
      return 'warning';
    case 'canceled':
    case 'refunded':
      return 'muted';
    default:
      return 'warning';
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}
