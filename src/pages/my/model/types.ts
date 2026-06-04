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
  claimRequestId: string | null;
  claimStatus: ClaimRequestStatus | null;
  isClaimRequested: boolean;
  publicVerifyCode: string;
  createdAt: string;
};

export type ClaimMethod = 'delivery' | 'pickup';
export type ClaimRequestStatus =
  | 'requested'
  | 'preparing'
  | 'ready_for_pickup'
  | 'shipping'
  | 'completed'
  | 'canceled';

export type MyClaimRequest = {
  id: string;
  claimMethod: ClaimMethod;
  status: ClaimRequestStatus;
  itemCount: number;
  pickupQrCode: string | null;
  createdAt: string;
};
