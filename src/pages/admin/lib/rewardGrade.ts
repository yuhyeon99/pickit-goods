import type { RewardGrade } from '../../gacha/model/types';
import type { AdminRewardItem, InventoryStatus } from '../model/rewardItemTypes';

export const rewardGradeLabels: Record<RewardGrade, string> = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
};

export const inventoryStatusLabels: Record<InventoryStatus, string> = {
  available: '사용 가능',
  reserved: '예약됨',
  drawn: '추첨됨',
  claimed: '수령 완료',
  void: '제외됨',
};

export const rewardItemStatusLabels: Record<AdminRewardItem['status'], string> = {
  active: '사용 중',
  hidden: '숨김',
  archived: '보관됨',
};

export const inventoryStatusOrder: InventoryStatus[] = [
  'available',
  'reserved',
  'drawn',
  'claimed',
  'void',
];
