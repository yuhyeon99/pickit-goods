import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminGachaProducts } from '../api/getAdminGachaProducts';
import { getAdminGachaStatus, rawGachaStatusLabels } from '../lib/gachaStatus';
import { formatCurrency } from '../lib/orderStatus';
import type { AdminGachaFilters, AdminGachaProduct } from '../model/gachaTypes';
import type { DrawProductStatus } from '../../gacha/model/types';

const statusOptions: Array<DrawProductStatus | 'all'> = [
  'all',
  'draft',
  'active',
  'sold_out',
  'hidden',
  'archived',
];

function shortId(value: string) {
  return value.slice(0, 8);
}

function filterProducts(products: AdminGachaProduct[], filters: AdminGachaFilters) {
  const search = filters.search.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch =
      search.length === 0 ||
      [product.id, product.title, product.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));
    const matchesStatus = filters.status === 'all' || product.status === filters.status;
    const matchesTheme = filters.themeId === 'all' || product.themeId === filters.themeId;
    const matchesInventory =
      filters.inventoryPresence === 'all' ||
      (filters.inventoryPresence === 'has_available' && product.availableInventoryCount > 0) ||
      (filters.inventoryPresence === 'no_available' && product.availableInventoryCount === 0);

    return matchesSearch && matchesStatus && matchesTheme && matchesInventory;
  });
}

function AdminGachaCard({ product }: { product: AdminGachaProduct }) {
  const status = getAdminGachaStatus(product.status, product.availableInventoryCount);

  return (
    <article className="admin-gacha-card">
      <div className="admin-gacha-header">
        <div>
          <div className="cart-item-title-row">
            <span className={`status-badge status-badge-${status.tone}`}>{status.label}</span>
            <span className="soft-badge">{status.rawLabel}</span>
            <span className="soft-badge">{product.scope === 'random' ? '랜덤' : '테마'}</span>
          </div>
          <h2>{product.title}</h2>
          <p>{product.description ?? '설명이 없습니다.'}</p>
        </div>
        <strong className="admin-gacha-price">{formatCurrency(product.price)}</strong>
      </div>

      <dl className="admin-gacha-summary">
        <div>
          <dt>상품 ID</dt>
          <dd>{shortId(product.id)}</dd>
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
          <dt>남은 구매 가능</dt>
          <dd>{product.remainingPurchaseQuantity}</dd>
        </div>
        <div>
          <dt>available 재고</dt>
          <dd>{product.availableInventoryCount}</dd>
        </div>
      </dl>

      <section className="admin-gacha-section">
        <h3>등급별 재고/확률</h3>
        <div className="admin-gacha-grade-grid">
          {product.gradeProbabilities.map((grade) => (
            <div key={grade.grade} className="admin-gacha-grade-card">
              <div>
                <span className="grade-badge">{grade.grade}</span>
                <strong>{grade.availableCount}개</strong>
              </div>
              <div className="admin-gacha-grade-meter">
                <span style={{ width: `${grade.probability}%` }} />
              </div>
              <small>{grade.probability}%</small>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-gacha-section">
        <h3>구성 상품</h3>
        {product.rewardItems.length === 0 ? (
          <p>구성 상품이 없습니다.</p>
        ) : (
          <div className="admin-gacha-reward-list">
            {product.rewardItems.map((item) => (
              <div key={item.id}>
                <span className="grade-badge">{item.grade}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.themeName ?? '테마 없음'} · 구성 {item.quantity}개
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

export function AdminGachaPage() {
  const [filters, setFilters] = useState<AdminGachaFilters>({
    search: '',
    status: 'all',
    themeId: 'all',
    inventoryPresence: 'all',
  });

  const {
    data: products = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-gacha-products'],
    queryFn: getAdminGachaProducts,
  });

  const themeOptions = useMemo(() => {
    const themes = new Map<string, string>();

    for (const product of products) {
      if (product.themeId && product.themeName) {
        themes.set(product.themeId, product.themeName);
      }
    }

    return Array.from(themes.entries());
  }, [products]);

  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [filters, products],
  );

  if (isLoading) {
    return <section className="state-card">가챠 상품을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>가챠 상품을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="admin-gacha-page">
      <div className="page-heading">
        <p className="section-label">Admin Gacha</p>
        <h1>가챠 상품/재고 조회</h1>
        <p>판매 상태, 판매 수량, available 재고, 등급별 확률과 구성 상품을 조회합니다. 상품 수정은 지원하지 않습니다.</p>
      </div>

      <section className="admin-gacha-filter-card">
        <label>
          검색
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="가챠명, 설명, 상품 ID"
          />
        </label>
        <label>
          상태
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as AdminGachaFilters['status'],
              }))
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? '전체 상태' : rawGachaStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          테마
          <select
            value={filters.themeId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, themeId: event.target.value }))
            }
          >
            <option value="all">전체 테마</option>
            {themeOptions.map(([themeId, themeName]) => (
              <option key={themeId} value={themeId}>
                {themeName}
              </option>
            ))}
          </select>
        </label>
        <label>
          재고
          <select
            value={filters.inventoryPresence}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                inventoryPresence: event.target.value as AdminGachaFilters['inventoryPresence'],
              }))
            }
          >
            <option value="all">전체</option>
            <option value="has_available">available 있음</option>
            <option value="no_available">available 없음</option>
          </select>
        </label>
        <span className="soft-badge">
          {filteredProducts.length} / {products.length}개
        </span>
      </section>

      {filteredProducts.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">상품 없음</span>
          <h2>조건에 맞는 가챠 상품이 없습니다.</h2>
          <p>가챠 상품이 생성되면 이곳에 최신순으로 표시됩니다.</p>
        </section>
      ) : (
        <div className="admin-gacha-list">
          {filteredProducts.map((product) => (
            <AdminGachaCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
