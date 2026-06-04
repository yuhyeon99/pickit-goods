import type { RewardGrade } from '../../gacha/model/types';
import type { InventoryStatus, InventoryStatusCounts } from '../model/rewardItemTypes';
import type { AdminPoolGradeStats } from '../model/poolTypes';

export const rewardGrades: RewardGrade[] = ['S', 'A', 'B', 'C'];

export function createEmptyInventoryCounts(): InventoryStatusCounts {
  return {
    available: 0,
    reserved: 0,
    drawn: 0,
    claimed: 0,
    void: 0,
  };
}

export function createEmptyGradeCounts(): Record<RewardGrade, number> {
  return {
    S: 0,
    A: 0,
    B: 0,
    C: 0,
  };
}

export function sumInventoryCounts(counts: InventoryStatusCounts) {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

export function incrementInventoryStatus(counts: InventoryStatusCounts, status: InventoryStatus) {
  counts[status] += 1;
}

export function calculatePoolGradeStats(
  totalByGrade: Record<RewardGrade, number>,
  availableByGrade: Record<RewardGrade, number>,
): AdminPoolGradeStats[] {
  const totalCount = Object.values(totalByGrade).reduce((sum, count) => sum + count, 0);
  const availableCount = Object.values(availableByGrade).reduce((sum, count) => sum + count, 0);

  return rewardGrades.map((grade) => ({
    grade,
    totalCount: totalByGrade[grade],
    availableCount: availableByGrade[grade],
    compositionRate:
      totalCount > 0 ? Math.round((totalByGrade[grade] / totalCount) * 1000) / 10 : 0,
    availableProbability:
      availableCount > 0
        ? Math.round((availableByGrade[grade] / availableCount) * 1000) / 10
        : 0,
  }));
}
