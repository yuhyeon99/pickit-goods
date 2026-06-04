import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { getMyDrawCredits } from '../api/getMyDrawCredits';
import type { DrawCreditStatus, MyDrawCredit } from '../api/getMyDrawCredits';

const statusLabels: Record<DrawCreditStatus, string> = {
  unused: '사용 가능',
  used: '사용 완료',
  expired: '만료',
  refunded: '환불됨',
  failed: '발급 실패',
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

function CreditCard({ credit }: { credit: MyDrawCredit }) {
  const canPlay = credit.status === 'unused' && credit.productStatus !== 'hidden';

  return (
    <article className="draw-credit-card">
      <div>
        <div className="cart-item-title-row">
          <span className={`credit-status-badge credit-status-${credit.status}`}>
            {statusLabels[credit.status]}
          </span>
          <span className="soft-badge">
            {credit.productScope === 'random' ? '랜덤 가챠' : '테마 가챠'}
          </span>
        </div>
        <h2>{credit.productTitle}</h2>
        <p>발급일 {formatDate(credit.createdAt)}</p>
      </div>
      {canPlay ? (
        <Link className="primary-link-button" to={`/gacha/${credit.drawProductId}/play`}>
          뽑기하러 가기
        </Link>
      ) : (
        <button className="disabled-cta" type="button" disabled>
          사용 불가
        </button>
      )}
    </article>
  );
}

export function MyDrawsPage() {
  const { user } = useAuth();

  const {
    data: credits = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['my-draw-credits', user?.id],
    queryFn: () => getMyDrawCredits(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });

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
        <p>테스트 결제로 발급된 가챠권을 확인하고 뽑기 화면으로 이동할 수 있습니다.</p>
      </div>

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
            <CreditCard key={credit.id} credit={credit} />
          ))}
        </div>
      )}
    </section>
  );
}
