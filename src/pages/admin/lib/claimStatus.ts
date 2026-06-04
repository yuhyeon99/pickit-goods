import type { ClaimMethod, ClaimRequestStatus } from '../../my/model/types';

export const adminClaimStatusLabels: Record<ClaimRequestStatus, string> = {
  requested: '요청됨',
  preparing: '준비 중',
  ready_for_pickup: '수령 가능',
  shipping: '배송 중',
  completed: '완료',
  canceled: '취소됨',
};

export const adminClaimMethodLabels: Record<ClaimMethod, string> = {
  delivery: '배송 수령',
  pickup: '현장 수령',
};

export function getNextClaimStatus(
  claimMethod: ClaimMethod,
  status: ClaimRequestStatus,
): ClaimRequestStatus | null {
  if (status === 'requested') return 'preparing';

  if (claimMethod === 'delivery') {
    if (status === 'preparing') return 'shipping';
    if (status === 'shipping') return 'completed';
  }

  if (claimMethod === 'pickup') {
    if (status === 'preparing') return 'ready_for_pickup';
    if (status === 'ready_for_pickup') return 'completed';
  }

  return null;
}

export function getAdminClaimActionLabel(status: ClaimRequestStatus) {
  switch (status) {
    case 'preparing':
      return '준비 중으로 변경';
    case 'shipping':
      return '배송 중으로 변경';
    case 'ready_for_pickup':
      return '수령 가능으로 변경';
    case 'completed':
      return '수령 완료 처리';
    default:
      return '상태 변경';
  }
}

export function getAdminClaimStatusTone(status: ClaimRequestStatus) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'canceled':
      return 'danger';
    case 'shipping':
    case 'ready_for_pickup':
      return 'warning';
    default:
      return 'muted';
  }
}
