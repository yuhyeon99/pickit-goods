import type { RefundRequestStatus } from '../../my/api/getMyDrawCredits';

export const adminRefundStatusLabels: Record<RefundRequestStatus, string> = {
  requested: '요청됨',
  approved: '승인됨',
  rejected: '거절됨',
  canceled: '취소됨',
  processed: '환불 완료',
};

export function getAdminRefundStatusTone(status: RefundRequestStatus) {
  if (status === 'processed') return 'success';
  if (status === 'approved') return 'active';
  if (status === 'rejected' || status === 'canceled') return 'danger';
  return 'pending';
}

export function getAdminRefundActions(status: RefundRequestStatus): RefundRequestStatus[] {
  if (status === 'requested') {
    return ['approved', 'rejected'];
  }

  if (status === 'approved') {
    return ['processed', 'rejected'];
  }

  return [];
}

export function getAdminRefundActionLabel(status: RefundRequestStatus) {
  if (status === 'approved') return '환불 승인';
  if (status === 'rejected') return '환불 거절';
  if (status === 'processed') return '환불 처리 완료';
  return adminRefundStatusLabels[status];
}
