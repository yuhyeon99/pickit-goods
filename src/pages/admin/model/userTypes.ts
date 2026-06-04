import type { DrawResultStatus } from '../../my/model/types';
import type { OrderStatus } from './orderTypes';
import type { RewardGrade } from '../../gacha/model/types';
import type { UserRole } from '../../../shared/model/auth/types';

export type CreditStatus = 'unused' | 'used' | 'expired' | 'refunded' | 'failed';

export type AdminUserCreditSummary = Record<CreditStatus, number> & {
  total: number;
};

export type AdminUserRecentOrder = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
};

export type AdminUserRecentDrawResult = {
  id: string;
  rewardName: string;
  drawProductTitle: string;
  grade: RewardGrade;
  status: DrawResultStatus;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  unusedCreditCount: number;
  usedCreditCount: number;
  drawResultCount: number;
  claimRequestCount: number;
  creditSummary: AdminUserCreditSummary;
  recentOrders: AdminUserRecentOrder[];
  recentDrawResults: AdminUserRecentDrawResult[];
};

export type AdminUserFilters = {
  search: string;
  role: UserRole | 'all';
  creditPresence: 'all' | 'has_unused' | 'no_unused';
};
