import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getAdminClaimRequests } from '../api/getAdminClaimRequests';
import { updateAdminClaimStatus } from '../api/updateAdminClaimStatus';
import {
  adminClaimMethodLabels,
  adminClaimStatusLabels,
  getAdminClaimActionLabel,
  getAdminClaimStatusTone,
  getNextClaimStatus,
} from '../lib/claimStatus';
import type { AdminClaimRequest, UpdateAdminClaimStatusInput } from '../model/claimTypes';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function AdminClaimCard({
  claim,
  isUpdating,
  onUpdate,
}: {
  claim: AdminClaimRequest;
  isUpdating: boolean;
  onUpdate: (input: UpdateAdminClaimStatusInput) => void;
}) {
  const nextStatus = getNextClaimStatus(claim.claimMethod, claim.status);
  const [trackingNumber, setTrackingNumber] = useState(claim.trackingNumber ?? '');
  const [adminNote, setAdminNote] = useState(claim.adminNote ?? '');
  const requiresTracking = claim.claimMethod === 'delivery' && nextStatus === 'shipping';
  const canSubmit = Boolean(nextStatus) && !isUpdating && (!requiresTracking || trackingNumber.trim());

  return (
    <article className="admin-claim-card">
      <div className="admin-claim-header">
        <div>
          <div className="cart-item-title-row">
            <span className={`item-status-badge item-status-${getAdminClaimStatusTone(claim.status)}`}>
              {adminClaimStatusLabels[claim.status]}
            </span>
            <span className="soft-badge">{adminClaimMethodLabels[claim.claimMethod]}</span>
          </div>
          <h2>요청 #{shortId(claim.id)}</h2>
          <p>
            {claim.userDisplayName ?? `사용자 ${shortId(claim.userId)}`} · 요청일{' '}
            {formatDate(claim.createdAt)}
          </p>
        </div>
        <span className="soft-badge">상품 {claim.items.length}개</span>
      </div>

      <section className="admin-claim-section">
        <h3>포함 상품</h3>
        <div className="admin-claim-item-list">
          {claim.items.map((item) => (
            <div key={item.id} className="admin-claim-item">
              <span className="grade-badge">{item.grade}</span>
              <div>
                <strong>{item.rewardName}</strong>
                <small>
                  {item.themeName ?? '여러 테마'} · {item.drawProductTitle} · 검증{' '}
                  {item.publicVerifyCode.slice(0, 8)}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {claim.claimMethod === 'delivery' ? (
        <section className="admin-claim-section">
          <h3>배송 정보</h3>
          <dl className="admin-claim-meta">
            <div>
              <dt>수령자</dt>
              <dd>{claim.recipientName ?? '-'}</dd>
            </div>
            <div>
              <dt>연락처</dt>
              <dd>{claim.recipientPhone ?? '-'}</dd>
            </div>
            <div>
              <dt>우편번호</dt>
              <dd>{claim.postalCode ?? '-'}</dd>
            </div>
            <div>
              <dt>주소</dt>
              <dd>
                {[claim.address1, claim.address2].filter(Boolean).join(' ') || '-'}
              </dd>
            </div>
            <div>
              <dt>요청사항</dt>
              <dd>{claim.deliveryNote ?? '-'}</dd>
            </div>
            <div>
              <dt>송장번호</dt>
              <dd>{claim.trackingNumber ?? '-'}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <section className="admin-claim-section">
          <h3>현장 수령 정보</h3>
          <dl className="admin-claim-meta">
            <div>
              <dt>수령 코드</dt>
              <dd>{claim.pickupQrCode ?? '-'}</dd>
            </div>
            <div>
              <dt>안내</dt>
              <dd>준비 완료 후 현장에서 수령 코드 확인이 필요합니다.</dd>
            </div>
          </dl>
        </section>
      )}

      {nextStatus ? (
        <section className="admin-claim-action">
          {requiresTracking ? (
            <label>
              송장번호
              <input
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value)}
                placeholder="배송중 변경 시 필수"
              />
            </label>
          ) : null}
          <label>
            관리자 메모
            <input
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="선택 입력"
            />
          </label>
          {nextStatus === 'completed' ? (
            <p className="admin-danger-note">
              완료 처리 시 연결된 당첨 결과와 재고가 수령 완료 상태로 변경됩니다.
            </p>
          ) : null}
          <button
            className={canSubmit ? 'primary-cta' : 'disabled-cta'}
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!nextStatus) return;

              onUpdate({
                claimRequestId: claim.id,
                nextStatus,
                trackingNumber,
                adminNote,
              });
            }}
          >
            {isUpdating ? '변경 중' : getAdminClaimActionLabel(nextStatus)}
          </button>
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

export function AdminClaimsPage() {
  const queryClient = useQueryClient();
  const {
    data: claims = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-claim-requests'],
    queryFn: getAdminClaimRequests,
  });

  const mutation = useMutation({
    mutationFn: updateAdminClaimStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-claim-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['my-draw-results'] });
      void queryClient.invalidateQueries({ queryKey: ['my-claim-requests'] });
    },
  });

  if (isLoading) {
    return <section className="state-card">수령 요청 목록을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>수령 요청 목록을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="admin-claims-page">
      <div className="page-heading">
        <p className="section-label">Admin Claims</p>
        <h1>수령 요청 처리</h1>
        <p>사용자 수령 요청을 확인하고 배송/현장 수령 흐름에 맞춰 상태를 변경합니다.</p>
      </div>

      {mutation.isError ? (
        <section className="state-card state-card-error">
          <strong>상태를 변경하지 못했습니다.</strong>
          <span>
            {mutation.error instanceof Error
              ? mutation.error.message
              : '알 수 없는 오류가 발생했습니다.'}
          </span>
        </section>
      ) : null}

      {claims.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">요청 없음</span>
          <h2>아직 접수된 수령 요청이 없습니다.</h2>
          <p>사용자가 보관함에서 수령 요청을 만들면 이곳에 표시됩니다.</p>
        </section>
      ) : (
        <div className="admin-claim-list">
          {claims.map((claim) => (
            <AdminClaimCard
              key={claim.id}
              claim={claim}
              isUpdating={mutation.isPending && mutation.variables?.claimRequestId === claim.id}
              onUpdate={(input) => mutation.mutate(input)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
