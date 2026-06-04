import type { ClaimMethod, ClaimRequestStatus, DrawResultStatus } from '../../my/model/types';
import type { RewardGrade } from '../../gacha/model/types';

export type AdminClaimItem = {
  id: string;
  drawResultId: string;
  rewardName: string;
  themeName: string | null;
  drawProductTitle: string;
  grade: RewardGrade;
  drawResultStatus: DrawResultStatus;
  publicVerifyCode: string;
  wonAt: string;
};

export type AdminClaimRequest = {
  id: string;
  userId: string;
  userDisplayName: string | null;
  claimMethod: ClaimMethod;
  status: ClaimRequestStatus;
  recipientName: string | null;
  recipientPhone: string | null;
  postalCode: string | null;
  address1: string | null;
  address2: string | null;
  deliveryNote: string | null;
  pickupQrCode: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: AdminClaimItem[];
};

export type UpdateAdminClaimStatusInput = {
  claimRequestId: string;
  nextStatus: ClaimRequestStatus;
  trackingNumber?: string;
  adminNote?: string;
};
