import type { DrawProductStatus, RewardGrade } from '../../gacha/model/types';

export type InventoryStatus = 'available' | 'reserved' | 'drawn' | 'claimed' | 'void';

export type InventoryStatusCounts = Record<InventoryStatus, number>;

export type AdminRewardPoolItem = {
  id: string;
  drawProductId: string;
  drawProductTitle: string;
  drawProductStatus: DrawProductStatus;
  drawProductPrice: number;
  drawProductThemeName: string | null;
  quantity: number;
};

export type AdminRewardItem = {
  id: string;
  name: string;
  description: string | null;
  grade: RewardGrade;
  category: string;
  status: 'active' | 'hidden' | 'archived';
  themeId: string | null;
  themeName: string | null;
  createdAt: string;
  updatedAt: string;
  inventoryCounts: InventoryStatusCounts;
  totalInventoryCount: number;
  poolItems: AdminRewardPoolItem[];
};

export type AdminRewardItemFilters = {
  search: string;
  grade: RewardGrade | 'all';
  themeId: string | 'all';
  inventoryPresence: 'all' | 'has_inventory' | 'no_inventory';
  poolSearch: string;
};
