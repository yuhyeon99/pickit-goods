import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function ClaimCard({ claim }: { claim: MyClaimRequest }) {
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
        <div className="won-item-grid">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </section>
  );
}
