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
  recipientName: string | null;
  recipientPhone: string | null;
  postalCode: string | null;
  address1: string | null;
  address2: string | null;
  deliveryNote: string | null;
  pickupQrCode: string | null;
  trackingNumber: string | null;
  createdAt: string;
  completedAt: string | null;
  items: MyClaimRequestItem[];
};

export type MyClaimRequestItem = {
  id: string;
  drawResultId: string;
  rewardName: string;
  themeName: string | null;
  drawProductTitle: string;
  grade: RewardGrade;
  wonAt: string;
};

export type MySummary = {
  unusedCreditCount: number;
  usedCreditCount: number;
  drawResultCount: number;
  claimRequestCount: number;
  cartItemCount: number;
  cartQuantity: number;
  recentCreditTitle: string | null;
  recentResultName: string | null;
  recentClaimStatus: ClaimRequestStatus | null;
};
