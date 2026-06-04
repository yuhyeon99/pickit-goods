import type { DrawResultStatus } from '../model/types';

export type DrawResultStatusView = {
  label: string;
  claimLabel: string;
  canRequestClaim: boolean;
  tone: 'success' | 'muted' | 'danger' | 'warning';
};

export function getDrawResultStatusLabel(
  status: DrawResultStatus,
  isClaimRequested = false,
): DrawResultStatusView {
  if (status === 'completed' && isClaimRequested) {
    return {
      label: '수령 요청됨',
      claimLabel: '수령 요청됨',
      canRequestClaim: false,
      tone: 'warning',
    };
  }

  switch (status) {
    case 'completed':
      return {
        label: '보관중',
        claimLabel: '수령 요청',
        canRequestClaim: true,
        tone: 'success',
      };
    case 'claimed':
      return {
        label: '수령 완료',
        claimLabel: '수령 완료',
        canRequestClaim: false,
        tone: 'muted',
      };
    case 'failed':
      return {
        label: '처리 실패',
        claimLabel: '수령 불가',
        canRequestClaim: false,
        tone: 'danger',
      };
    case 'recoverable':
      return {
        label: '확인 필요',
        claimLabel: '확인 필요',
        canRequestClaim: false,
        tone: 'warning',
      };
  }
}
