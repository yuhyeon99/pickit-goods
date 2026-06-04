import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { addCartItem } from '../../cart/api/addCartItem';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { getGachaProductDetail } from '../api/getGachaProductDetail';
import { getDrawProductDisplayStatus } from '../lib/getDrawProductDisplayStatus';
import type { GachaProductDetail, GachaRewardItem } from '../model/types';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price);

function RewardItemCard({ item }: { item: GachaRewardItem }) {
  return (
    <article className="reward-item-card">
      <div className="reward-item-heading">
        <span className="grade-badge">{item.grade}</span>
        <div>
          <h3>{item.name}</h3>
          <p>{item.themeName ?? '여러 테마'}</p>
        </div>
      </div>
      <p className="reward-item-description">{item.description}</p>
      <dl className="reward-item-meta">
        <div>
          <dt>카테고리</dt>
          <dd>{item.category}</dd>
        </div>
        <div>
          <dt>구성 수량</dt>
          <dd>{item.quantity}</dd>
        </div>
      </dl>
    </article>
  );
}

function DetailContent({ product }: { product: GachaProductDetail }) {
  const { user, isAuthenticated, signInWithGoogle } = useAuth();
  const queryClient = useQueryClient();
  const displayStatus = getDrawProductDisplayStatus(
    product.status,
    product.availableInventoryCount,
  );
  const canAddToCart =
    isAuthenticated && product.status === 'active' && product.remainingPurchaseQuantity > 0;

  const addCartMutation = useMutation({
    mutationFn: () =>
      addCartItem({
        userId: user?.id ?? '',
        drawProductId: product.id,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart-items', user?.id] });
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      void signInWithGoogle();
      return;
    }

    addCartMutation.mutate();
  };

  const ctaLabel = !isAuthenticated
    ? '로그인하고 장바구니 담기'
    : product.status !== 'active'
      ? '신규 구매 불가'
      : product.remainingPurchaseQuantity < 1
        ? '남은 수량 없음'
        : addCartMutation.isPending
          ? '담는 중'
          : '장바구니 담기';

  return (
    <section className="gacha-detail-page">
      <div className="detail-hero-card">
        <div className="detail-hero-content">
          <span className={`status-badge status-badge-${displayStatus.tone}`}>
            {displayStatus.label}
          </span>
          <div>
            <p className="section-label">Gacha Detail</p>
            <h1>{product.title}</h1>
          </div>
          <p>{product.description}</p>
        </div>
        <aside className="purchase-summary-card">
          <span className="summary-label">테스트 가격</span>
          <strong>{formatPrice(product.price)}</strong>
          <button
            className={canAddToCart || !isAuthenticated ? 'primary-cta' : 'disabled-cta'}
            type="button"
            disabled={isAuthenticated && (!canAddToCart || addCartMutation.isPending)}
            onClick={handleAddToCart}
          >
            {ctaLabel}
          </button>
          <p>
            {isAuthenticated
              ? `구매 가능 수량 ${product.remainingPurchaseQuantity}개`
              : '로그인 후 가챠 이용권을 장바구니에 담을 수 있습니다.'}
          </p>
          {addCartMutation.isSuccess ? (
            <p className="success-message">장바구니에 담았습니다.</p>
          ) : null}
          {addCartMutation.isError ? (
            <p className="error-message">
              {addCartMutation.error instanceof Error
                ? addCartMutation.error.message
                : '장바구니에 담지 못했습니다.'}
            </p>
          ) : null}
        </aside>
      </div>

      <section className="detail-section-grid">
        <div className="info-card">
          <h2>기본 정보</h2>
          <dl className="detail-info-list">
            <div>
              <dt>구분</dt>
              <dd>{product.scope === 'random' ? '랜덤 가챠' : '테마 가챠'}</dd>
            </div>
            <div>
              <dt>테마</dt>
              <dd>{product.themeName ?? '여러 테마'}</dd>
            </div>
            <div>
              <dt>판매량</dt>
              <dd>
                {product.soldCount} / {product.salesLimit}
              </dd>
            </div>
            <div>
              <dt>구매 가능 수량</dt>
              <dd>{product.remainingPurchaseQuantity}개</dd>
            </div>
            <div>
              <dt>남은 뽑기 재고</dt>
              <dd>{product.availableInventoryCount}개</dd>
            </div>
          </dl>
        </div>

        <div className="info-card">
          <h2>등급별 확률</h2>
          <p className="section-help">
            확률은 현재 남은 뽑기 재고 기준으로 표시되며, 뽑기 진행 상황에 따라 변경될 수 있습니다.
          </p>
          <div className="probability-list">
            {product.gradeProbabilities.map((grade) => (
              <div key={grade.grade} className="probability-row">
                <span className="grade-badge">{grade.grade}</span>
                <div className="probability-meter" aria-hidden="true">
                  <span style={{ width: `${grade.probability}%` }} />
                </div>
                <strong>{grade.availableCount}개</strong>
                <em>{grade.probability}%</em>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="info-card">
        <div className="section-heading-row">
          <div>
            <p className="section-label">Reward Items</p>
            <h2>포함 상품</h2>
          </div>
          <span className="soft-badge">{product.rewardItems.length}개 구성</span>
        </div>
        <div className="reward-item-grid">
          {product.rewardItems.map((item) => (
            <RewardItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="fairness-card">
        <span className="soft-badge">공정성 안내</span>
        <h2>결과는 서버에서 안전하게 결정됩니다.</h2>
        <p>
          추첨 결과는 서버에서 안전한 난수 생성 방식으로 결정됩니다. 클라이언트에서는 결과를
          생성하거나 수정할 수 없으며, 모든 추첨 결과는 로그로 보관됩니다.
        </p>
      </section>

      <section className="info-card policy-link-card">
        <span className="soft-badge">구매 전 확인</span>
        <h2>확률, 환불, 수령 기준을 확인해주세요</h2>
        <p>
          가챠권은 30일간 사용할 수 있고, 실제 상품은 추첨 시점에 확정됩니다.
          구매 전 공정성, 환불, 배송/수령 안내를 확인할 수 있습니다.
        </p>
        <div className="guide-actions">
          <Link className="text-link-inline" to="/fairness">
            공정성 안내
          </Link>
          <Link className="text-link-inline" to="/policy/refund">
            환불 정책
          </Link>
          <Link className="text-link-inline" to="/policy/shipping">
            배송/수령 안내
          </Link>
        </div>
      </section>

      <section className="sticky-cta-card">
        <div>
          <strong>{product.title}</strong>
          <span>
            {formatPrice(product.price)} · 구매 가능 수량 {product.remainingPurchaseQuantity}개
          </span>
        </div>
        <button
          className={canAddToCart || !isAuthenticated ? 'primary-cta' : 'disabled-cta'}
          type="button"
          disabled={isAuthenticated && (!canAddToCart || addCartMutation.isPending)}
          onClick={handleAddToCart}
        >
          {ctaLabel}
        </button>
      </section>
    </section>
  );
}

export function GachaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: product,
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['gacha-product-detail', id],
    queryFn: () => getGachaProductDetail(id ?? ''),
    enabled: Boolean(id),
  });

  if (!id) {
    return (
      <section className="state-card state-card-error">
        <strong>잘못된 접근입니다.</strong>
        <span>가챠 상품 ID가 없습니다.</span>
      </section>
    );
  }

  if (isLoading) {
    return <section className="state-card">가챠 상세 정보를 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>가챠 상세 정보를 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="state-card">
        <strong>가챠 상품을 찾을 수 없습니다.</strong>
        <Link className="text-link" to="/gacha">
          목록으로 돌아가기
        </Link>
      </section>
    );
  }

  return <DetailContent product={product} />;
}
