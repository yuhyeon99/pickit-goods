import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { PickupQrCode } from '../../../shared/ui/PickupQrCode';
import { getMyClaimRequests } from '../api/getMyClaimRequests';
import type { ClaimRequestStatus, MyClaimRequest } from '../model/types';

const statusLabels: Record<ClaimRequestStatus, string> = {
  requested: '요청됨',
  preparing: '준비중',
  ready_for_pickup: '수령 가능',
  shipping: '배송중',
  completed: '완료',
  canceled: '취소됨',
};

const statusDescriptions: Record<ClaimRequestStatus, string> = {
  requested: '요청이 접수되었습니다. 운영자 확인 후 준비가 시작됩니다.',
  preparing: '상품 수령 준비가 진행 중입니다.',
  ready_for_pickup: '현장에서 수령 가능한 상태입니다.',
  shipping: '배송이 시작되었습니다.',
  completed: '수령 처리가 완료되었습니다.',
  canceled: '수령 요청이 취소되었습니다.',
};

function formatDate(value: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function ClaimCard({ claim }: { claim: MyClaimRequest }) {
  const isDelivery = claim.claimMethod === 'delivery';

  return (
    <article className="claim-history-card">
      <div>
        <div className="cart-item-title-row">
          <span className="item-status-badge item-status-warning">{statusLabels[claim.status]}</span>
          <span className="soft-badge">{claim.claimMethod === 'delivery' ? '배송' : '현장 수령'}</span>
        </div>
        <h2>요청 #{claim.id.slice(0, 8)}</h2>
        <p>요청일 {formatDate(claim.createdAt)}</p>
      </div>
      <dl className="won-item-meta">
        <div>
          <dt>포함 상품</dt>
          <dd>{claim.itemCount}개</dd>
        </div>
        <div>
          <dt>수령 코드</dt>
          <dd>{claim.pickupQrCode?.slice(0, 20) ?? '-'}</dd>
        </div>
      </dl>
      <details className="claim-detail-panel">
        <summary>상세 보기</summary>
        <section>
          <h3>요청 상태</h3>
          <dl className="claim-detail-meta">
            <div>
              <dt>요청 ID</dt>
              <dd>{claim.id.slice(0, 8)}</dd>
            </div>
            <div>
              <dt>수령 방식</dt>
              <dd>{isDelivery ? '배송 수령' : '현장 수령'}</dd>
            </div>
            <div>
              <dt>현재 상태</dt>
              <dd>{statusLabels[claim.status]}</dd>
            </div>
            <div>
              <dt>완료일</dt>
              <dd>{formatDate(claim.completedAt)}</dd>
            </div>
          </dl>
          <p>{statusDescriptions[claim.status]}</p>
        </section>

        {isDelivery ? (
          <section>
            <h3>배송지 정보</h3>
            <dl className="claim-detail-meta">
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
                <dd>{claim.address1 ?? '-'}</dd>
              </div>
              <div>
                <dt>상세 주소</dt>
                <dd>{claim.address2 ?? '-'}</dd>
              </div>
              <div>
                <dt>배송 요청사항</dt>
                <dd>{claim.deliveryNote ?? '-'}</dd>
              </div>
              <div>
                <dt>송장번호</dt>
                <dd>{claim.trackingNumber ?? '-'}</dd>
              </div>
            </dl>
          </section>
        ) : (
          <section>
            <h3>현장 수령 정보</h3>
            <PickupQrCode code={claim.pickupQrCode} />
            <dl className="claim-detail-meta">
              <div>
                <dt>수령 코드</dt>
                <dd>{claim.pickupQrCode ?? '-'}</dd>
              </div>
              <div>
                <dt>수령 가능 여부</dt>
                <dd>{claim.status === 'ready_for_pickup' ? '수령 가능' : '운영자 준비 후 가능'}</dd>
              </div>
              <div>
                <dt>수령 완료</dt>
                <dd>{claim.status === 'completed' ? '완료' : '미완료'}</dd>
              </div>
            </dl>
          </section>
        )}

        <section>
          <h3>포함 상품</h3>
          <div className="claim-detail-item-list">
            {claim.items.map((item) => (
              <div key={item.id} className="claim-detail-item">
                <span className="grade-badge">{item.grade}</span>
                <div>
                  <strong>{item.rewardName}</strong>
                  <small>
                    {item.themeName ?? '여러 테마'} · {item.drawProductTitle} · 당첨일{' '}
                    {formatDate(item.wonAt)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </details>
    </article>
  );
}

export function MyClaimsPage() {
  const { user } = useAuth();

  const {
    data: claims = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['my-claim-requests', user?.id],
    queryFn: () => getMyClaimRequests(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });

  if (isLoading) {
    return <section className="state-card">수령 요청 내역을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>수령 요청 내역을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="my-items-page">
      <div className="page-heading">
        <p className="section-label">Claims</p>
        <h1>수령 요청 내역</h1>
        <p>접수된 수령 요청과 현재 상태를 확인할 수 있습니다.</p>
      </div>

      {claims.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">요청 없음</span>
          <h2>아직 수령 요청이 없습니다.</h2>
          <p>보관함에서 보관중인 당첨 상품을 선택해 수령 요청을 만들 수 있습니다.</p>
          <Link className="primary-link-button" to="/my/items">
            보관함 보기
          </Link>
        </section>
      ) : (
        <div className="claim-history-list">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </section>
  );
}
