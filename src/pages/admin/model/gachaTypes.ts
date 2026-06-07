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
  imageUrl: string | null;
  price: number;
  creditAmount: number;
  status: DrawProductStatus;
  scope: DrawProductScope;
  themeId: string | null;
  themeName: string | null;
  displayThemeName: string | null;
  salesLimit: number;
  soldCount: number;
  remainingPurchaseQuantity: number;
  availableInventoryCount: number;
  totalInventoryCount: number;
  availableGradeCounts: GradeCounts;
  gradeProbabilities: GradeProbability[];
  rewardItems: AdminGachaRewardItem[];
  createdAt: string;
  updatedAt: string;
};

export type AdminGachaFilters = {
  search: string;
  status: DrawProductStatus | 'all';
  themeId: string | 'all';
  inventoryPresence: 'all' | 'has_available' | 'no_available';
};

export type AdminGachaProductFormInput = {
  id?: string;
  title: string;
  themeId: string;
  description: string;
  imageUrl: string;
  price: string;
  creditAmount: string;
  salesLimit: string;
  status: DrawProductStatus;
};

export type AdminGachaProductMutationInput = {
  id?: string;
  title: string;
  themeId: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  creditAmount: number;
  salesLimit: number;
  status: DrawProductStatus;
};
