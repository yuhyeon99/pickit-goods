import type {
  DrawProductScope,
  DrawProductStatus,
  GradeCounts,
  GradeProbability,
  RewardGrade,
} from '../../gacha/model/types';

export type AdminGachaRewardItem = {
  id: string;
  name: string;
  grade: RewardGrade;
  themeName: string | null;
  quantity: number;
};

export type AdminGachaProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: DrawProductStatus;
  scope: DrawProductScope;
  themeId: string | null;
  themeName: string | null;
  salesLimit: number;
  soldCount: number;
  remainingPurchaseQuantity: number;
  availableInventoryCount: number;
  availableGradeCounts: GradeCounts;
  gradeProbabilities: GradeProbability[];
  rewardItems: AdminGachaRewardItem[];
  createdAt: string;
};

export type AdminGachaFilters = {
  search: string;
  status: DrawProductStatus | 'all';
  themeId: string | 'all';
  inventoryPresence: 'all' | 'has_available' | 'no_available';
};
