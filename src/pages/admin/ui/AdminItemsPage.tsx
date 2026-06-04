import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminRewardItems } from '../api/getAdminRewardItems';
import { getAdminGachaStatus } from '../lib/gachaStatus';
import { formatCurrency } from '../lib/orderStatus';
import { inventoryStatusLabels, inventoryStatusOrder, rewardItemStatusLabels } from '../lib/rewardGrade';
import type { AdminRewardItem, AdminRewardItemFilters } from '../model/rewardItemTypes';
import type { RewardGrade } from '../../gacha/model/types';

const gradeOptions: Array<RewardGrade | 'all'> = ['all', 'S', 'A', 'B', 'C'];

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

function filterItems(items: AdminRewardItem[], filters: AdminRewardItemFilters) {
  const search = filters.search.trim().toLowerCase();
  const poolSearch = filters.poolSearch.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      search.length === 0 ||
      [item.id, item.name, item.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));
    const matchesGrade = filters.grade === 'all' || item.grade === filters.grade;
    const matchesTheme = filters.themeId === 'all' || item.themeId === filters.themeId;
    const matchesInventory =
      filters.inventoryPresence === 'all' ||
      (filters.inventoryPresence === 'has_inventory' && item.totalInventoryCount > 0) ||
      (filters.inventoryPresence === 'no_inventory' && item.totalInventoryCount === 0);
    const matchesPool =
      poolSearch.length === 0 ||
      item.poolItems.some((poolItem) =>
        [poolItem.drawProductId, poolItem.drawProductTitle]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(poolSearch)),
      );

    return matchesSearch && matchesGrade && matchesTheme && matchesInventory && matchesPool;
  });
}

function AdminRewardItemCard({ item }: { item: AdminRewardItem }) {
  return (
    <article className="admin-reward-card">
      <div className="admin-reward-header">
        <div>
          <div className="cart-item-title-row">
            <span className="grade-badge">{item.grade}</span>
            <span className="soft-badge">{rewardItemStatusLabels[item.status]}</span>
            <span className="soft-badge">조회 전용</span>
          </div>
          <h2>{item.name}</h2>
          <p>{item.description ?? '설명이 없습니다.'}</p>
        </div>
        <span className="soft-badge">상품 #{shortId(item.id)}</span>
      </div>

      <dl className="admin-reward-summary">
        <div>
          <dt>테마</dt>
          <dd>{item.themeName ?? '테마 없음'}</dd>
        </div>
        <div>
          <dt>카테고리</dt>
          <dd>{item.category}</dd>
        </div>
        <div>
          <dt>생성일</dt>
          <dd>{formatDate(item.createdAt)}</dd>
        </div>
        <div>
          <dt>수정일</dt>
          <dd>{formatDate(item.updatedAt)}</dd>
        </div>
      </dl>

      <section className="admin-reward-section">
        <h3>재고 상태별 수량</h3>
        <div className="admin-reward-inventory-grid">
          {inventoryStatusOrder.map((status) => (
            <div key={status}>
              <dt>{inventoryStatusLabels[status]}</dt>
              <dd>{item.inventoryCounts[status]}</dd>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-reward-section">
        <h3>포함된 가챠/상품 풀</h3>
        {item.poolItems.length === 0 ? (
          <p>아직 포함된 가챠 상품 풀이 없습니다.</p>
        ) : (
          <div className="admin-reward-pool-list">
            {item.poolItems.map((poolItem) => {
              const status = getAdminGachaStatus(poolItem.drawProductStatus, 1);

              return (
                <div key={poolItem.id}>
                  <div>
                    <strong>{poolItem.drawProductTitle}</strong>
                    <small>
                      {poolItem.drawProductThemeName ?? '여러 테마'} · {formatCurrency(poolItem.drawProductPrice)}
                    </small>
                  </div>
                  <div className="cart-item-title-row">
                    <span className={`status-badge status-badge-${status.tone}`}>{status.rawLabel}</span>
                    <span className="soft-badge">구성 {poolItem.quantity}개</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
}

export function AdminItemsPage() {
  const [filters, setFilters] = useState<AdminRewardItemFilters>({
    search: '',
    grade: 'all',
    themeId: 'all',
    inventoryPresence: 'all',
    poolSearch: '',
  });

  const {
    data: items = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-reward-items'],
    queryFn: getAdminRewardItems,
  });

  const themeOptions = useMemo(() => {
    const themes = new Map<string, string>();

    for (const item of items) {
      if (item.themeId && item.themeName) {
        themes.set(item.themeId, item.themeName);
      }
    }

    return Array.from(themes.entries());
  }, [items]);

  const filteredItems = useMemo(() => filterItems(items, filters), [filters, items]);

  if (isLoading) {
    return <section className="state-card">실물 상품을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>실물 상품을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="admin-reward-page">
      <div className="page-heading">
        <p className="section-label">관리자 · 실물 상품</p>
        <h1>실물 상품 조회</h1>
        <p>당첨 대상 상품의 등급, 테마, 포함된 가챠 상품 풀, 재고 상태별 수량을 조회합니다. 상품 수정은 지원하지 않습니다.</p>
      </div>

      <section className="admin-reward-filter-card">
        <label>
          검색
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="상품명, 설명, 상품 ID"
          />
        </label>
        <label>
          포함 가챠
          <input
            value={filters.poolSearch}
            onChange={(event) =>
              setFilters((current) => ({ ...current, poolSearch: event.target.value }))
            }
            placeholder="가챠명 또는 가챠 ID"
          />
        </label>
        <label>
          등급
          <select
            value={filters.grade}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                grade: event.target.value as AdminRewardItemFilters['grade'],
              }))
            }
          >
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade === 'all' ? '전체 등급' : grade}
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
                inventoryPresence: event.target.value as AdminRewardItemFilters['inventoryPresence'],
              }))
            }
          >
            <option value="all">전체</option>
            <option value="has_inventory">재고 있음</option>
            <option value="no_inventory">재고 없음</option>
          </select>
        </label>
        <span className="soft-badge">
          {filteredItems.length} / {items.length}개
        </span>
      </section>

      {filteredItems.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">상품 없음</span>
          <h2>조건에 맞는 실물 상품이 없습니다.</h2>
          <p>실물 상품이 생성되면 이곳에 최신순으로 표시됩니다.</p>
        </section>
      ) : (
        <div className="admin-reward-list">
          {filteredItems.map((item) => (
            <AdminRewardItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
