import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getAdminRefundRequests } from '../api/getAdminRefundRequests';
import { updateAdminRefundStatus } from '../api/updateAdminRefundStatus';
import {
  adminRefundStatusLabels,
  getAdminRefundActionLabel,
  getAdminRefundActions,
  getAdminRefundStatusTone,
} from '../lib/refundStatus';
import { orderStatusLabels } from '../lib/orderStatus';
import type { AdminRefundRequest, UpdateAdminRefundStatusInput } from '../model/refundTypes';

const creditStatusLabels: Record<AdminRefundRequest['creditStatus'], string> = {
  unused: '사용 가능',
  used: '사용 완료',
  expired: '만료됨',
  refunded: '환불됨',
  failed: '발급 실패',
};

function formatDate(value: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function shortId(value: string | null) {
  return value ? value.slice(0, 8) : '-';
}

function AdminRefundCard({
  refund,
  isUpdating,
  onUpdate,
}: {
  refund: AdminRefundRequest;
  isUpdating: boolean;
  onUpdate: (input: UpdateAdminRefundStatusInput) => void;
}) {
  const [adminNote, setAdminNote] = useState(refund.adminNote ?? '');
  const actions = getAdminRefundActions(refund.status);
  const requester = refund.userDisplayName ?? refund.userEmail ?? `사용자 ${shortId(refund.userId)}`;

  return (
    <article className="admin-claim-card">
      <div className="admin-claim-header">
        <div>
          <div className="cart-item-title-row">
            <span className={`item-status-badge item-status-${getAdminRefundStatusTone(refund.status)}`}>
              {adminRefundStatusLabels[refund.status]}
            </span>
            <span className="soft-badge">조회/처리</span>
          </div>
          <h2>환불 요청 #{shortId(refund.id)}</h2>
          <p>
            {requester} · 요청일 {formatDate(refund.requestedAt)}
          </p>
        </div>
        <span className="soft-badge">가챠권 #{shortId(refund.userDrawCreditId)}</span>
      </div>

      <section className="admin-claim-section">
        <h3>요청 정보</h3>
        <dl className="admin-claim-meta">
          <div>
            <dt>가챠 상품</dt>
            <dd>{refund.drawProductTitle}</dd>
          </div>
          <div>
            <dt>주문 ID</dt>
            <dd>{shortId(refund.orderId)}</dd>
          </div>
          <div>
            <dt>주문 상태</dt>
            <dd>{refund.orderStatus ? orderStatusLabels[refund.orderStatus] : '-'}</dd>
          </div>
          <div>
            <dt>가챠권 상태</dt>
            <dd>{creditStatusLabels[refund.creditStatus]}</dd>
          </div>
          <div>
            <dt>가챠권 만료일</dt>
            <dd>{formatDate(refund.creditExpiresAt)}</dd>
          </div>
          <div>
            <dt>처리일</dt>
            <dd>{formatDate(refund.processedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-claim-section">
        <h3>환불 사유</h3>
        <p>{refund.reason}</p>
        {refund.adminNote ? <p className="refund-status-text">관리자 메모 · {refund.adminNote}</p> : null}
      </section>

      {actions.length > 0 ? (
        <section className="admin-claim-action">
          <label>
            관리자 메모
            <input
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="선택 입력"
            />
          </label>
          {actions.includes('processed') ? (
            <p className="admin-danger-note">
              환불 처리 완료 시 연결된 가챠권이 환불됨 상태로 변경되고 판매 반영 수량이 1개 복구됩니다.
            </p>
          ) : null}
          <div className="draw-credit-actions">
            {actions.map((nextStatus) => (
              <button
                key={nextStatus}
                className={nextStatus === 'rejected' ? 'text-button' : 'primary-cta'}
                type="button"
                disabled={isUpdating}
                onClick={() =>
                  onUpdate({
                    refundRequestId: refund.id,
                    nextStatus,
                    adminNote,
                  })
                }
              >
                {isUpdating ? '변경 중' : getAdminRefundActionLabel(nextStatus)}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="admin-claim-action">
          <button className="disabled-cta" type="button" disabled>
            변경 가능한 다음 상태 없음
          </button>
        </section>
      )}
    </article>
  );
}

export function AdminRefundsPage() {
  const queryClient = useQueryClient();
  const {
    data: refunds = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-refund-requests'],
    queryFn: getAdminRefundRequests,
  });

  const mutation = useMutation({
    mutationFn: updateAdminRefundStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-refund-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['my-draw-credits'] });
    },
  });

  if (isLoading) {
    return <section className="state-card">환불 요청 목록을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>환불 요청 목록을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="admin-claims-page">
      <div className="page-heading">
        <p className="section-label">관리자 · 환불 요청</p>
        <h1>환불 요청 처리</h1>
        <p>미사용·만료 전 가챠권 환불 요청을 확인하고 MVP 수동 처리 상태를 변경합니다.</p>
      </div>

      {mutation.isError ? (
        <section className="state-card state-card-error">
          <strong>환불 요청 상태를 변경하지 못했습니다.</strong>
          <span>
            {mutation.error instanceof Error
              ? mutation.error.message
              : '알 수 없는 오류가 발생했습니다.'}
          </span>
        </section>
      ) : null}

      {refunds.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">요청 없음</span>
          <h2>아직 접수된 환불 요청이 없습니다.</h2>
          <p>사용자가 보유 가챠권 화면에서 환불 요청을 만들면 이곳에 표시됩니다.</p>
        </section>
      ) : (
        <div className="admin-claim-list">
          {refunds.map((refund) => (
            <AdminRefundCard
              key={refund.id}
              refund={refund}
              isUpdating={mutation.isPending && mutation.variables?.refundRequestId === refund.id}
              onUpdate={(input) => mutation.mutate(input)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
