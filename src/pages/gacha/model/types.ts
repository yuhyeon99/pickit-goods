export type DrawProductStatus = 'draft' | 'active' | 'sold_out' | 'hidden' | 'archived';
export type DrawProductScope = 'random' | 'theme';
export type RewardGrade = 'S' | 'A' | 'B' | 'C';

export type GradeCounts = Record<RewardGrade, number>;

export type GachaProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: DrawProductStatus;
  salesLimit: number;
  soldCount: number;
  scope: DrawProductScope;
  themeId: string | null;
  themeName: string | null;
  availableInventoryCount: number;
  availableGradeCounts: GradeCounts;
};

export type GradeProbability = {
  grade: RewardGrade;
  availableCount: number;
  probability: number;
};

export type GachaRewardItem = {
  id: string;
  name: string;
  description: string | null;
  grade: RewardGrade;
  category: string;
  themeName: string | null;
  quantity: number;
};

export type GachaProductDetail = GachaProduct & {
  rewardItems: GachaRewardItem[];
  gradeProbabilities: GradeProbability[];
};
