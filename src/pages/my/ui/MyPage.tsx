import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { getMySummary } from '../api/getMySummary';
import type { MySummary } from '../model/types';

const roleLabels = {
  user: '일반 사용자',
  admin: '관리자',
} as const;

const claimStatusLabels = {
  requested: '요청됨',
  preparing: '준비중',
  ready_for_pickup: '수령 가능',
  shipping: '배송중',
  completed: '완료',
  canceled: '취소됨',
} as const;

function formatDate(value?: string) {
  if (!value) return '가입일 확인 중';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function SummaryCards({ summary }: { summary: MySummary }) {
  const cards = [
    { label: '사용 가능 가챠권', value: `${summary.unusedCreditCount}장` },
    { label: '사용 완료 가챠권', value: `${summary.usedCreditCount}장` },
    { label: '당첨 상품', value: `${summary.drawResultCount}개` },
    { label: '수령 요청', value: `${summary.claimRequestCount}건` },
    { label: '장바구니 수량', value: `${summary.cartQuantity}개` },
  ];

  return (
    <div className="my-summary-grid" aria-label="내 활동 요약">
      {cards.map((card) => (
        <article className="my-summary-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </div>
  );
}

function NavigationCards({ summary }: { summary?: MySummary }) {
  const cards = [
    {
      title: '보유 가챠권',
      description: '구매한 가챠권을 확인하고 뽑기를 진행할 수 있어요.',
      to: '/my/draws',
      count: summary ? `${summary.unusedCreditCount}장 사용 가능` : '가챠권 확인',
      cta: '가챠권 보기',
    },
    {
      title: '당첨 상품 보관함',
      description: '뽑기로 획득한 상품을 확인하고 수령 요청할 수 있어요.',
      to: '/my/items',
      count: summary ? `${summary.drawResultCount}개 보관` : '보관함 확인',
      cta: '보관함 보기',
    },
    {
      title: '수령 요청 내역',
      description: '배송 또는 현장 수령 요청 상태를 확인할 수 있어요.',
      to: '/my/claims',
      count: summary ? `${summary.claimRequestCount}건` : '요청 내역 확인',
      cta: '요청 내역 보기',
    },
    {
      title: '주문 내역',
      description: '테스트 결제로 생성된 주문과 발급된 가챠권 수량을 확인할 수 있어요.',
      to: '/my/orders',
      count: '주문 확인',
      cta: '주문 내역 보기',
    },
    {
      title: '장바구니',
      description: '담아둔 가챠 이용권을 확인하고 테스트 결제로 이어갈 수 있어요.',
      to: '/cart',
      count: summary ? `${summary.cartQuantity}개 담김` : '장바구니 확인',
      cta: '장바구니 보기',
    },
  ];

  return (
    <div className="my-dashboard-grid">
      {cards.map((card) => (
        <Link className="my-dashboard-link-card" to={card.to} key={card.to}>
          <div>
            <span className="soft-badge">{card.count}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </div>
          <strong>
            {card.cta}
            <span aria-hidden="true">-&gt;</span>
          </strong>
        </Link>
      ))}
    </div>
  );
}

function RecentActivity({ summary }: { summary: MySummary }) {
  return (
    <section className="my-recent-card">
      <div>
        <span className="summary-label">최근 활동</span>
        <h2>다음 행동을 이어가세요</h2>
      </div>
      <dl>
        <div>
          <dt>최근 발급 가챠권</dt>
          <dd>{summary.recentCreditTitle ?? '아직 발급된 가챠권이 없습니다.'}</dd>
        </div>
        <div>
          <dt>최근 당첨 상품</dt>
          <dd>{summary.recentResultName ?? '아직 당첨 상품이 없습니다.'}</dd>
        </div>
        <div>
          <dt>최근 수령 요청</dt>
          <dd>
            {summary.recentClaimStatus
              ? claimStatusLabels[summary.recentClaimStatus]
              : '아직 수령 요청이 없습니다.'}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function MyPage() {
  const { user, profile } = useAuth();

  const {
    data: summary,
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['my-summary', user?.id],
    queryFn: () => getMySummary(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });

  const displayName = profile?.displayName ?? user?.email?.split('@')[0] ?? '사용자';
  const roleLabel = roleLabels[profile?.role ?? 'user'];

  return (
    <section className="my-dashboard-page">
      <div className="page-heading">
        <p className="section-label">My Page</p>
        <h1>마이페이지</h1>
        <p>가챠권, 당첨 상품, 수령 요청을 한곳에서 확인하고 다음 행동으로 이동하세요.</p>
      </div>

      <section className="my-profile-card">
        {profile?.avatarUrl ? (
          <img className="my-avatar" src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" />
        ) : (
          <div className="my-avatar my-avatar-empty" aria-hidden="true">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="my-profile-main">
          <span className="soft-badge">{roleLabel}</span>
          <h2>{displayName}</h2>
          <p>{user?.email ?? '이메일 정보 없음'}</p>
        </div>
        <dl className="my-profile-meta">
          <div>
            <dt>가입일</dt>
            <dd>{formatDate(user?.created_at)}</dd>
          </div>
          <div>
            <dt>사용자 ID</dt>
            <dd>{user?.id.slice(0, 8) ?? '-'}</dd>
          </div>
        </dl>
      </section>

      {isLoading ? (
        <section className="state-card">내 활동 요약을 불러오는 중입니다.</section>
      ) : null}

      {isError ? (
        <section className="state-card state-card-error">
          <strong>내 활동 요약을 불러오지 못했습니다.</strong>
          <span>
            {error instanceof Error
              ? error.message
              : '이동 카드는 계속 사용할 수 있습니다.'}
          </span>
        </section>
      ) : null}

      {summary ? <SummaryCards summary={summary} /> : null}

      <NavigationCards summary={summary} />

      {summary ? <RecentActivity summary={summary} /> : null}
    </section>
  );
}
