import type { UserRole } from '../../../shared/model/auth/types';

export const userRoleLabels: Record<UserRole, string> = {
  user: '일반 사용자',
  admin: '관리자',
};

export function getUserRoleTone(role: UserRole) {
  return role === 'admin' ? 'warning' : 'muted';
}
