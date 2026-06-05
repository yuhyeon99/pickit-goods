import type { DrawCreditStatus, RefundRequestStatus } from '../../my/api/getMyDrawCredits';

export type AdminRefundRequest = {
  id: string;
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  orderId: string | null;
  orderStatus: string | null;
  userDrawCreditId: string;
  creditStatus: DrawCreditStatus;
  creditExpiresAt: string;
  creditCreatedAt: string;
  drawProductTitle: string;
  reason: string;
  status: RefundRequestStatus;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAdminRefundStatusInput = {
  refundRequestId: string;
  nextStatus: RefundRequestStatus;
  adminNote?: string;
};
