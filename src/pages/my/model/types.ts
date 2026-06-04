import type { DrawProductScope, RewardGrade } from '../../gacha/model/types';

export type DrawResultStatus = 'completed' | 'recoverable' | 'failed' | 'claimed';

export type MyDrawResult = {
  id: string;
  drawProductId: string;
  drawProductTitle: string;
  drawProductScope: DrawProductScope;
  rewardItemId: string;
  rewardName: string;
  rewardDescription: string | null;
  rewardCategory: string;
  themeName: string | null;
  grade: RewardGrade;
  status: DrawResultStatus;
  publicVerifyCode: string;
  createdAt: string;
};
