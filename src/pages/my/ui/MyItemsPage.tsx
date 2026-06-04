import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { getDrawResultStatusLabel } from '../lib/getDrawResultStatusLabel';
import { getMyDrawResults } from '../api/getMyDrawResults';
import type { MyDrawResult } from '../model/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function ItemCard({ item }: { item: MyDrawResult }) {
  const status = getDrawResultStatusLabel(item.status);

  return (
    <article className="won-item-card">
      <div className="won-item-main">
        <div className="draw-result-grade">
          <span>{item.grade}</span>
        </div>
        <div>
          <div className="cart-item-title-row">
            <span className={`item-status-badge item-status-${status.tone}`}>{status.label}</span>
            <span className="soft-badge">
              {item.drawProductScope === 'random' ? '랜덤 가챠' : '테마 가챠'}
            </span>
          </div>
          <h2>{item.rewardName}</h2>
          <p>{item.rewardDescription ?? '상품 설명이 준비 중입니다.'}</p>
        </div>
      </div>

      <dl className="won-item-meta">
        <div>
          <dt>테마</dt>
          <dd>{item.themeName ?? '여러 테마'}</dd>
        </div>
        <div>
          <dt>가챠명</dt>
          <dd>{item.drawProductTitle}</dd>
        </div>
        <div>
          <dt>당첨일</dt>
          <dd>{formatDate(item.createdAt)}</dd>
        </div>
        <div>
          <dt>검증 코드</dt>
          <dd>{item.publicVerifyCode.slice(0, 8)}</dd>
        </div>
      </dl>

      <div className="won-item-actions">
        {status.canRequestClaim ? (
          <Link className="primary-link-button" to="/claim">
            {status.claimLabel}
          </Link>
        ) : (
          <button className="disabled-cta" type="button" disabled>
            {status.claimLabel}
          </button>
        )}
        <span>수령 요청 생성은 다음 단계에서 연결됩니다.</span>
      </div>
    </article>
  );
}

export function MyItemsPage() {
  const { user } = useAuth();

  const {
    data: items = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['my-draw-results', user?.id],
    queryFn: () => getMyDrawResults(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });

  if (isLoading) {
    return <section className="state-card">당첨 상품을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>당첨 상품을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="my-items-page">
      <div className="page-heading">
        <p className="section-label">Won Items</p>
        <h1>당첨 상품 보관함</h1>
        <p>서버 추첨으로 확정된 당첨 상품과 검증 코드를 확인할 수 있습니다.</p>
      </div>

      {items.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">보관함 비어 있음</span>
          <h2>아직 당첨 상품이 없습니다.</h2>
          <p>보유 가챠권으로 뽑기를 진행하면 이곳에 당첨 상품이 보관됩니다.</p>
          <Link className="primary-link-button" to="/my/draws">
            보유 가챠권 보기
          </Link>
        </section>
      ) : (
        <div className="won-item-grid">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
