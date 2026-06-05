import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PickupQrCode } from '../../../shared/ui/PickupQrCode';
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

const claimStatusDescriptions = {
  requested: '요청이 접수되었습니다. 준비 단계로 변경할 수 있습니다.',
  preparing: '상품 확인과 포장 또는 현장 수령 준비가 진행 중입니다.',
  ready_for_pickup: '현장에서 수령 가능한 상태입니다.',
  shipping: '배송이 시작되었습니다. 완료 처리 전 송장 정보를 확인하세요.',
  completed: '수령 처리가 완료되었습니다.',
  canceled: '수령 요청이 취소되었습니다.',
};

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
        <details className="claim-detail-panel" open>
          <summary>요청 상세</summary>
          <section>
            <h3>요청 상태</h3>
            <dl className="admin-claim-meta">
              <div>
                <dt>요청 ID</dt>
                <dd>{shortId(claim.id)}</dd>
              </div>
              <div>
                <dt>요청자</dt>
                <dd>{claim.userDisplayName ?? `사용자 ${shortId(claim.userId)}`}</dd>
              </div>
              <div>
                <dt>수령 방식</dt>
                <dd>{adminClaimMethodLabels[claim.claimMethod]}</dd>
              </div>
              <div>
                <dt>현재 상태</dt>
                <dd>{adminClaimStatusLabels[claim.status]}</dd>
              </div>
              <div>
                <dt>요청일</dt>
                <dd>{formatDate(claim.createdAt)}</dd>
              </div>
              <div>
                <dt>완료일</dt>
                <dd>{claim.completedAt ? formatDate(claim.completedAt) : '-'}</dd>
              </div>
            </dl>
            <p>{claimStatusDescriptions[claim.status]}</p>
          </section>

          <section>
            <h3>포함 상품</h3>
            <div className="admin-claim-item-list">
              {claim.items.map((item) => (
                <div key={item.id} className="admin-claim-item">
                  <span className="grade-badge">{item.grade}</span>
                  <div>
                    <strong>{item.rewardName}</strong>
                    <small>
                      {item.themeName ?? '여러 테마'} · {item.drawProductTitle} · 당첨일{' '}
                      {formatDate(item.wonAt)} · 검증 {item.publicVerifyCode.slice(0, 8)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </details>
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
          <PickupQrCode code={claim.pickupQrCode} />
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
                placeholder="배송 중 변경 시 필수"
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
  const [searchParams, setSearchParams] = useSearchParams();
  const pickupCodeFilter = searchParams.get('pickupCode')?.trim() ?? '';
  const {
    data: claims = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-claim-requests'],
    queryFn: getAdminClaimRequests,
  });

  const filteredClaims = pickupCodeFilter
    ? claims.filter((claim) => claim.pickupQrCode === pickupCodeFilter)
    : claims;

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
        <p className="section-label">관리자 · 수령 요청</p>
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

      {pickupCodeFilter ? (
        <section className="admin-pickup-filter-card">
          <div>
            <span className="soft-badge">수령 코드 필터</span>
            <p>수령 코드 {pickupCodeFilter} 로 필터링 중입니다.</p>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.delete('pickupCode');
                return next;
              });
            }}
          >
            필터 해제
          </button>
        </section>
      ) : null}

      {filteredClaims.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">{pickupCodeFilter ? '검색 결과 없음' : '요청 없음'}</span>
          <h2>
            {pickupCodeFilter
              ? '해당 수령 코드의 요청이 없습니다.'
              : '아직 접수된 수령 요청이 없습니다.'}
          </h2>
          <p>
            {pickupCodeFilter
              ? '수령 코드를 다시 확인하거나 필터를 해제해 전체 요청을 확인해주세요.'
              : '사용자가 보관함에서 수령 요청을 만들면 이곳에 표시됩니다.'}
          </p>
        </section>
      ) : (
        <div className="admin-claim-list">
          {filteredClaims.map((claim) => (
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
