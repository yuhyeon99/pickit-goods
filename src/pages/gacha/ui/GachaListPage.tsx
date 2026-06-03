import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getGachaProducts } from '../api/getGachaProducts';
import { getDrawProductDisplayStatus } from '../lib/getDrawProductDisplayStatus';
import type { GachaProduct, RewardGrade } from '../model/types';

const grades: RewardGrade[] = ['S', 'A', 'B', 'C'];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price);

function GachaProductCard({ product }: { product: GachaProduct }) {
  const displayStatus = getDrawProductDisplayStatus(
    product.status,
    product.availableInventoryCount,
  );

  return (
    <article className="gacha-card">
      <div className="gacha-card-header">
        <div className="gacha-card-title-group">
          <span className={`status-badge status-badge-${displayStatus.tone}`}>
            {displayStatus.label}
          </span>
          <h2>{product.title}</h2>
        </div>
        <strong className="gacha-price">{formatPrice(product.price)}</strong>
      </div>

      <p className="gacha-description">{product.description}</p>

      <dl className="gacha-meta-grid">
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
          <dt>남은 재고</dt>
          <dd>{product.availableInventoryCount}</dd>
        </div>
      </dl>

      <div className="grade-counts" aria-label={`${product.title} 등급별 남은 수량`}>
        {grades.map((grade) => (
          <div key={grade} className="grade-pill">
            <span>{grade}</span>
            <strong>{product.availableGradeCounts[grade]}</strong>
          </div>
        ))}
      </div>

      <Link className="detail-button" to={`/gacha/${product.id}`}>
        상세보기
      </Link>
    </article>
  );
}

export function GachaListPage() {
  const {
    data: products,
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['gacha-products'],
    queryFn: getGachaProducts,
  });

  return (
    <section className="gacha-list-page">
      <div className="gacha-hero">
        <span className="status-badge">판매중</span>
        <h1>가챠 목록</h1>
        <p>
          현재 판매 중인 MVP 가챠 상품입니다. 남은 재고와 등급별 수량은 Supabase
          seed data 기준으로 표시됩니다.
        </p>
      </div>

      {isLoading ? (
        <div className="state-card">가챠 상품을 불러오는 중입니다.</div>
      ) : null}

      {isError ? (
        <div className="state-card state-card-error">
          <strong>가챠 상품을 불러오지 못했습니다.</strong>
          <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
        </div>
      ) : null}

      {!isLoading && !isError && products?.length === 0 ? (
        <div className="state-card">현재 판매 중인 가챠 상품이 없습니다.</div>
      ) : null}

      {products && products.length > 0 ? (
        <div className="gacha-card-grid">
          {products.map((product) => (
            <GachaProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
