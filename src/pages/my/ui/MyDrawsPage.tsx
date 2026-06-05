import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { cancelRefundRequest } from '../api/cancelRefundRequest';
import { createRefundRequest } from '../api/createRefundRequest';
import { getMyDrawCredits } from '../api/getMyDrawCredits';
import type { DrawCreditStatus, MyDrawCredit, RefundRequestStatus } from '../api/getMyDrawCredits';

const statusLabels: Record<DrawCreditStatus, string> = {
  unused: '사용 가능',
  used: '사용 완료',
  expired: '만료',
  refunded: '환불됨',
  failed: '발급 실패',
};

const refundStatusLabels: Record<RefundRequestStatus, string> = {
  requested: '환불 요청 중',
  approved: '환불 승인됨',
  rejected: '환불 거절됨',
  canceled: '환불 요청 취소됨',
  processed: '환불 완료',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function getEffectiveStatus(credit: MyDrawCredit): DrawCreditStatus {
  if (credit.status === 'unused' && new Date(credit.expiresAt).getTime() <= Date.now()) {
    return 'expired';
  }

  return credit.status;
}

function getRemainingDays(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function CreditCard({
  credit,
  isCreatingRefund,
  isCancelingRefund,
  onCreateRefund,
  onCancelRefund,
}: {
  credit: MyDrawCredit;
  isCreatingRefund: boolean;
  isCancelingRefund: boolean;
  onCreateRefund: (input: { creditId: string; reason: string }) => void;
  onCancelRefund: (refundRequestId: string) => void;
}) {
  const [isRefundFormOpen, setIsRefundFormOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const effectiveStatus = getEffectiveStatus(credit);
  const activeRefundRequest =
    credit.refundRequest?.status === 'requested' || credit.refundRequest?.status === 'approved';
  const isRefundProcessed = credit.refundRequest?.status === 'processed';
  const canRefund =
    effectiveStatus === 'unused' && !activeRefundRequest && !isRefundProcessed && credit.status !== 'refunded';
  const canPlay =
    effectiveStatus === 'unused' && credit.productStatus !== 'hidden' && !activeRefundRequest;
  const remainingDays = getRemainingDays(credit.expiresAt);
  const refundReasonTrimmed = refundReason.trim();

  return (
    <article className="draw-credit-card">
      <div>
        <div className="cart-item-title-row">
          <span className={`credit-status-badge credit-status-${effectiveStatus}`}>
            {statusLabels[effectiveStatus]}
          </span>
          <span className="soft-badge">
            {credit.productScope === 'random' ? '랜덤 가챠' : '테마 가챠'}
          </span>
        </div>
        <h2>{credit.productTitle}</h2>
        <dl className="draw-credit-meta">
          <div>
            <dt>발급일</dt>
            <dd>{formatDate(credit.createdAt)}</dd>
          </div>
          <div>
            <dt>만료일</dt>
            <dd>{formatDateOnly(credit.expiresAt)}</dd>
          </div>
          <div>
            <dt>남은 기간</dt>
            <dd>{effectiveStatus === 'unused' ? `${remainingDays}일` : statusLabels[effectiveStatus]}</dd>
          </div>
        </dl>
        {effectiveStatus === 'expired' ? (
          <p>만료된 가챠권입니다. 이 가챠권으로는 추첨을 진행할 수 없습니다.</p>
        ) : null}
        {credit.refundRequest ? (
          <p className="refund-status-text">
            {refundStatusLabels[credit.refundRequest.status]}
            {credit.refundRequest.adminNote ? ` · ${credit.refundRequest.adminNote}` : ''}
          </p>
        ) : null}
      </div>
      <div className="draw-credit-actions">
        {canPlay ? (
          <Link className="primary-link-button" to={`/gacha/${credit.drawProductId}/play`}>
            뽑기하러 가기
          </Link>
        ) : (
          <button className="disabled-cta" type="button" disabled>
            {activeRefundRequest ? '환불 요청 중' : '사용 불가'}
          </button>
        )}
        {canRefund ? (
          <button
            className="text-button"
            type="button"
            onClick={() => setIsRefundFormOpen((current) => !current)}
          >
            환불 요청
          </button>
        ) : null}
        {credit.refundRequest?.status === 'requested' ? (
          <button
            className="text-button"
            type="button"
            disabled={isCancelingRefund}
            onClick={() => onCancelRefund(credit.refundRequest?.id ?? '')}
          >
            {isCancelingRefund ? '취소 중' : '환불 요청 취소'}
          </button>
        ) : null}
      </div>
      {isRefundFormOpen && canRefund ? (
        <form
          className="refund-request-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!refundReasonTrimmed) return;
            onCreateRefund({ creditId: credit.id, reason: refundReasonTrimmed });
            setIsRefundFormOpen(false);
            setRefundReason('');
          }}
        >
          <label>
            환불 사유
            <textarea
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              placeholder="환불 요청 사유를 입력해주세요."
            />
          </label>
          <button
            className={refundReasonTrimmed && !isCreatingRefund ? 'primary-cta' : 'disabled-cta'}
            type="submit"
            disabled={!refundReasonTrimmed || isCreatingRefund}
          >
            {isCreatingRefund ? '요청 중' : '환불 요청 보내기'}
          </button>
        </form>
      ) : null}
    </article>
  );
}

export function MyDrawsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['my-draw-credits', user?.id];

  const {
    data: credits = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey,
    queryFn: () => getMyDrawCredits(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });

  const createRefundMutation = useMutation({
    mutationFn: createRefundRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const cancelRefundMutation = useMutation({
    mutationFn: cancelRefundRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const mutationError =
    createRefundMutation.error instanceof Error
      ? createRefundMutation.error.message
      : cancelRefundMutation.error instanceof Error
        ? cancelRefundMutation.error.message
        : null;

  if (isLoading) {
    return <section className="state-card">보유 가챠권을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>보유 가챠권을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="my-draws-page">
      <div className="page-heading">
        <p className="section-label">My Draws</p>
        <h1>보유 가챠권</h1>
        <p>테스트 결제로 발급된 가챠권을 확인하고, 사용 전 가챠권은 유효기간 내 환불 요청할 수 있습니다.</p>
      </div>

      {mutationError ? (
        <section className="state-card state-card-error">
          <strong>환불 요청을 처리하지 못했습니다.</strong>
          <span>{mutationError}</span>
        </section>
      ) : null}

      {credits.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">보유권 없음</span>
          <h2>아직 사용할 수 있는 가챠권이 없습니다.</h2>
          <p>가챠 상품을 장바구니에 담고 테스트 결제를 완료하면 가챠권이 발급됩니다.</p>
          <Link className="primary-link-button" to="/gacha">
            가챠 보러가기
          </Link>
        </section>
      ) : (
        <div className="draw-credit-list">
          {credits.map((credit) => (
            <CreditCard
              key={credit.id}
              credit={credit}
              isCreatingRefund={
                createRefundMutation.isPending &&
                createRefundMutation.variables?.userDrawCreditId === credit.id
              }
              isCancelingRefund={
                cancelRefundMutation.isPending &&
                cancelRefundMutation.variables === credit.refundRequest?.id
              }
              onCreateRefund={(input) =>
                createRefundMutation.mutate({
                  userDrawCreditId: input.creditId,
                  reason: input.reason,
                })
              }
              onCancelRefund={(refundRequestId) => cancelRefundMutation.mutate(refundRequestId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
