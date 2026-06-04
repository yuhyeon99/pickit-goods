import type { RewardGrade } from '../../gacha/model/types';
import type { InventoryStatus } from '../model/rewardItemTypes';

export const rewardGradeLabels: Record<RewardGrade, string> = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
};

export const inventoryStatusLabels: Record<InventoryStatus, string> = {
  available: 'available',
  reserved: 'reserved',
  drawn: 'drawn',
  claimed: 'claimed',
  void: 'void',
};

export const inventoryStatusOrder: InventoryStatus[] = [
  'available',
  'reserved',
  'drawn',
  'claimed',
  'void',
];
