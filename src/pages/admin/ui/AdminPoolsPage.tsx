import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminPools } from '../api/getAdminPools';
import { getAdminGachaStatus, rawGachaStatusLabels } from '../lib/gachaStatus';
import { formatCurrency } from '../lib/orderStatus';
import { inventoryStatusOrder } from '../lib/rewardGrade';
import type { AdminPool, AdminPoolFilters } from '../model/poolTypes';
import type { DrawProductStatus, RewardGrade } from '../../gacha/model/types';

const statusOptions: Array<DrawProductStatus | 'all'> = [
  'all',
  'draft',
  'active',
  'sold_out',
  'hidden',
  'archived',
];
const gradeOptions: Array<RewardGrade | 'all'> = ['all', 'S', 'A', 'B', 'C'];

function shortId(value: string) {
  return value.slice(0, 8);
}

function filterPools(pools: AdminPool[], filters: AdminPoolFilters) {
  const search = filters.search.trim().toLowerCase();

  return pools.filter((pool) => {
    const matchesSearch =
      search.length === 0 ||
      [pool.id, pool.title]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search)) ||
      pool.poolItems.some((item) =>
        [item.rewardItemId, item.rewardItemName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search)),
      );
    const matchesStatus = filters.status === 'all' || pool.status === filters.status;
    const matchesGrade =
      filters.grade === 'all' || pool.poolItems.some((item) => item.grade === filters.grade);
    const matchesMismatch =
      filters.mismatch === 'all' ||
      (filters.mismatch === 'has_mismatch' && pool.hasMismatch) ||
      (filters.mismatch === 'matched' && !pool.hasMismatch);

    return matchesSearch && matchesStatus && matchesGrade && matchesMismatch;
  });
}

function AdminPoolCard({ pool }: { pool: AdminPool }) {
  const status = getAdminGachaStatus(pool.status, pool.availableInventoryCount);

  return (
    <article className="admin-pool-card">
      <div className="admin-pool-header">
        <div>
          <div className="cart-item-title-row">
            <span className={`status-badge status-badge-${status.tone}`}>{status.rawLabel}</span>
            <span className="soft-badge">{pool.type}</span>
            <span className="soft-badge">{pool.scope === 'random' ? '랜덤' : '테마'}</span>
            <span className={pool.hasMismatch ? 'item-status-badge item-status-warning' : 'item-status-badge item-status-success'}>
              {pool.hasMismatch ? '재고 확인 필요' : '구성 일치'}
            </span>
          </div>
          <h2>{pool.title}</h2>
          <p>
            풀 #{shortId(pool.id)} · {pool.themeName ?? '여러 테마'} · {formatCurrency(pool.price)}
          </p>
        </div>
      </div>

      <dl className="admin-pool-summary">
        <div>
          <dt>판매된 가챠권</dt>
          <dd>
            {pool.soldCount} / {pool.salesLimit}
          </dd>
        </div>
        <div>
          <dt>신규 구매 가능 수량</dt>
          <dd>{pool.remainingPurchaseQuantity}</dd>
        </div>
        <div>
          <dt>미추첨 재고</dt>
          <dd>{pool.availableInventoryCount}</dd>
        </div>
        <div>
          <dt>전체 재고</dt>
          <dd>{pool.totalInventoryCount}</dd>
        </div>
        <div>
          <dt>구성 상품</dt>
          <dd>{pool.poolItems.length}개</dd>
        </div>
      </dl>

      <section className="admin-pool-section">
        <h3>등급별 구성 비율 / 현재 확률</h3>
        <div className="admin-pool-grade-grid">
          {pool.gradeStats.map((grade) => (
            <div key={grade.grade}>
              <div>
                <span className="grade-badge">{grade.grade}</span>
                <strong>{grade.totalCount}개</strong>
              </div>
              <dl>
                <div>
                  <dt>전체 구성</dt>
                  <dd>{grade.compositionRate}%</dd>
                </div>
                <div>
                  <dt>available 확률</dt>
                  <dd>{grade.availableProbability}%</dd>
                </div>
              </dl>
              <div className="admin-pool-grade-meter">
                <span style={{ width: `${grade.availableProbability}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-pool-section">
        <h3>상품 풀 구성</h3>
        {pool.poolItems.length === 0 ? (
          <p>구성된 상품이 없습니다.</p>
        ) : (
          <div className="admin-pool-item-list">
            {pool.poolItems.map((item) => (
              <div key={item.id} className={item.isQuantityMatched ? '' : 'admin-pool-item-warning'}>
                <div className="admin-pool-item-heading">
                  <span className="grade-badge">{item.grade}</span>
                  <div>
                    <strong>{item.rewardItemName}</strong>
                    <small>
                      상품 #{shortId(item.rewardItemId)} · {item.rewardItemThemeName ?? '테마 없음'}
                    </small>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>설정</dt>
                    <dd>{item.configuredQuantity}</dd>
                  </div>
                  <div>
                    <dt>실제</dt>
                    <dd>{item.actualInventoryCount}</dd>
                  </div>
                  {inventoryStatusOrder.map((statusKey) => (
                    <div key={statusKey}>
                      <dt>{statusKey}</dt>
                      <dd>{item.inventoryCounts[statusKey]}</dd>
                    </div>
                  ))}
                </dl>
                <p>
                  {item.isQuantityMatched
                    ? '설정 수량과 실제 재고 수량이 일치합니다.'
                    : `설정 수량 ${item.configuredQuantity}개 / 실제 재고 ${item.actualInventoryCount}개 - 재고 구성 확인 필요`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

export function AdminPoolsPage() {
  const [filters, setFilters] = useState<AdminPoolFilters>({
    search: '',
    status: 'all',
    grade: 'all',
    mismatch: 'all',
  });

  const {
    data: pools = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-pools'],
    queryFn: getAdminPools,
  });

  const filteredPools = useMemo(() => filterPools(pools, filters), [filters, pools]);

  if (isLoading) {
    return <section className="state-card">상품 풀 정보를 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>상품 풀 정보를 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="admin-pools-page">
      <div className="page-heading">
        <p className="section-label">Admin Pools</p>
        <h1>상품 풀/재고 구성 조회</h1>
        <p>가챠별 상품 풀 설정 수량, 신규 구매 가능 수량, 미추첨 재고와 실제 inventory_units 상태 분포를 비교합니다. 수정 기능은 지원하지 않습니다.</p>
      </div>

      <section className="admin-pool-filter-card">
        <label>
          검색
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="가챠명, 상품명, draw/reward id"
          />
        </label>
        <label>
          상태
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as AdminPoolFilters['status'],
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
          등급
          <select
            value={filters.grade}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                grade: event.target.value as AdminPoolFilters['grade'],
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
          일치 여부
          <select
            value={filters.mismatch}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                mismatch: event.target.value as AdminPoolFilters['mismatch'],
              }))
            }
          >
            <option value="all">전체</option>
            <option value="has_mismatch">불일치 있음</option>
            <option value="matched">정상</option>
          </select>
        </label>
        <span className="soft-badge">
          {filteredPools.length} / {pools.length}개
        </span>
      </section>

      {filteredPools.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">상품 풀 없음</span>
          <h2>조건에 맞는 상품 풀이 없습니다.</h2>
          <p>draw_product_items와 inventory_units가 구성되면 이곳에 표시됩니다.</p>
        </section>
      ) : (
        <div className="admin-pool-list">
          {filteredPools.map((pool) => (
            <AdminPoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </section>
  );
}
