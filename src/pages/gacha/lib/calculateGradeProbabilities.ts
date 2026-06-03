import type { GradeCounts, GradeProbability, RewardGrade } from '../model/types';

const grades: RewardGrade[] = ['S', 'A', 'B', 'C'];

export function calculateGradeProbabilities(
  gradeCounts: GradeCounts,
  totalAvailableCount: number,
): GradeProbability[] {
  return grades.map((grade) => ({
    grade,
    availableCount: gradeCounts[grade],
    probability:
      totalAvailableCount > 0
        ? Math.round((gradeCounts[grade] / totalAvailableCount) * 1000) / 10
        : 0,
  }));
}
