import type { UserRole } from '../../../shared/model/auth/types';
import type { CreditStatus } from '../model/userTypes';

export const userRoleLabels: Record<UserRole, string> = {
  user: '일반 사용자',
  admin: '관리자',
};

export const creditStatusLabels: Record<CreditStatus, string> = {
  unused: '사용 가능',
  used: '사용 완료',
  expired: '만료됨',
  refunded: '환불됨',
  failed: '발급 실패',
};

export function getUserRoleTone(role: UserRole) {
  return role === 'admin' ? 'warning' : 'muted';
}
