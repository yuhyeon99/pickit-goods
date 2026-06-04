import type { DrawResultStatus } from '../../my/model/types';
import type { RewardGrade } from '../../gacha/model/types';

export type DrawLogEventType = 'started' | 'reserved' | 'completed' | 'failed' | 'recovered';

export type AdminDrawLog = {
  id: string;
  drawResultId: string | null;
  userId: string;
  userDisplayName: string | null;
  drawProductId: string | null;
  drawProductTitle: string | null;
  requestId: string;
  eventType: DrawLogEventType;
  randomMethod: string | null;
  randomSeedHash: string | null;
  inventorySnapshotHash: string | null;
  selectedInventoryUnitId: string | null;
  availableInventoryCount: number | null;
  payload: unknown;
  errorMessage: string | null;
  createdAt: string;
  resultStatus: DrawResultStatus | null;
  publicVerifyCode: string | null;
  rewardName: string | null;
  themeName: string | null;
  grade: RewardGrade | null;
};

export type AdminDrawLogFilters = {
  search: string;
  grade: RewardGrade | 'all';
  eventType: DrawLogEventType | 'all';
};
