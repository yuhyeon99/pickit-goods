import type {
  DrawProductScope,
  DrawProductStatus,
  RewardGrade,
} from '../../gacha/model/types';
import type { InventoryStatusCounts } from './rewardItemTypes';

export type AdminPoolGradeStats = {
  grade: RewardGrade;
  totalCount: number;
  availableCount: number;
  compositionRate: number;
  availableProbability: number;
};

export type AdminPoolItem = {
  id: string;
  rewardItemId: string;
  rewardItemName: string;
  rewardItemThemeName: string | null;
  grade: RewardGrade;
  configuredQuantity: number;
  actualInventoryCount: number;
  inventoryCounts: InventoryStatusCounts;
  isQuantityMatched: boolean;
};

export type AdminPool = {
  id: string;
  title: string;
  type: 'gacha' | 'ticket';
  status: DrawProductStatus;
  scope: DrawProductScope;
  price: number;
  themeId: string | null;
  themeName: string | null;
  salesLimit: number;
  soldCount: number;
  availableInventoryCount: number;
  totalInventoryCount: number;
  hasMismatch: boolean;
  gradeStats: AdminPoolGradeStats[];
  poolItems: AdminPoolItem[];
  createdAt: string;
};

export type AdminPoolFilters = {
  search: string;
  status: DrawProductStatus | 'all';
  grade: RewardGrade | 'all';
  mismatch: 'all' | 'has_mismatch' | 'matched';
};

export type PoolInventoryAccumulator = {
  total: number;
  byStatus: InventoryStatusCounts;
  byGrade: Record<RewardGrade, number>;
  availableByGrade: Record<RewardGrade, number>;
};
