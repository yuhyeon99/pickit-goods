import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminOrders } from '../api/getAdminOrders';
import { formatCurrency, getOrderStatusTone, orderStatusLabels } from '../lib/orderStatus';
import type { AdminOrder, AdminOrderFilters, OrderStatus } from '../model/orderTypes';

const orderStatusOptions: Array<OrderStatus | 'all'> = [
  'all',
  'pending',
  'paid',
  'canceled',
  'refund_requested',
  'refunded',
];

function formatDate(value: string | null) {
  if (!value) return '-';

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

function getUserLabel(order: AdminOrder) {
  return order.userDisplayName ?? `사용자 ${shortId(order.userId)}`;
}

function filterOrders(orders: AdminOrder[], filters: AdminOrderFilters) {
  const search = filters.search.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesSearch =
      search.length === 0 ||
      [order.id, order.userId, order.userDisplayName]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));
    const matchesStatus = filters.status === 'all' || order.status === filters.status;

    return matchesSearch && matchesStatus;
  });
}

function AdminOrderCard({ order }: { order: AdminOrder }) {
  return (
    <article className="admin-order-card">
      <div className="admin-order-header">
        <div>
          <div className="cart-item-title-row">
            <span className={`item-status-badge item-status-${getOrderStatusTone(order.status)}`}>
              {orderStatusLabels[order.status]}
            </span>
            <span className="soft-badge">조회 전용</span>
          </div>
          <h2>주문 #{shortId(order.id)}</h2>
          <p>
            {getUserLabel(order)} · 주문일 {formatDate(order.createdAt)}
          </p>
        </div>
        <strong className="admin-order-total">{formatCurrency(order.totalAmount)}</strong>
      </div>

      <dl className="admin-order-summary">
        <div>
          <dt>결제 완료일</dt>
          <dd>{formatDate(order.paidAt)}</dd>
        </div>
        <div>
          <dt>상품 수</dt>
          <dd>{order.items.length}개</dd>
        </div>
        <div>
          <dt>발급 가챠권</dt>
          <dd>{order.totalIssuedQuantity}개</dd>
        </div>
        <div>
          <dt>취소일</dt>
          <dd>{formatDate(order.canceledAt)}</dd>
        </div>
      </dl>

      <section className="admin-order-items">
        <h3>주문 상품</h3>
        <div className="admin-order-item-list">
          {order.items.map((item) => (
            <div key={item.id} className="admin-order-item">
              <div>
                <strong>{item.drawProductTitle}</strong>
                <small>
                  수량 {item.quantity}개 · 단가 {formatCurrency(item.unitPrice)} · 발급 기준 수량{' '}
                  {item.creditAmount}
                </small>
              </div>
              <dl>
                <div>
                  <dt>합계</dt>
                  <dd>{formatCurrency(item.totalPrice)}</dd>
                </div>
                <div>
                  <dt>발급</dt>
                  <dd>{item.issuedQuantity}개</dd>
                </div>
                <div>
                  <dt>발급일</dt>
                  <dd>{formatDate(item.issuedAt)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

export function AdminOrdersPage() {
  const [filters, setFilters] = useState<AdminOrderFilters>({
    search: '',
    status: 'all',
  });

  const {
    data: orders = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: getAdminOrders,
  });

  const filteredOrders = useMemo(() => filterOrders(orders, filters), [filters, orders]);

  if (isLoading) {
    return <section className="state-card">주문 내역을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>주문 내역을 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="admin-orders-page">
      <div className="page-heading">
        <p className="section-label">관리자 · 주문 내역</p>
        <h1>주문/결제 내역</h1>
        <p>테스트 결제로 생성된 주문과 발급된 가챠권 수량을 조회합니다. 주문 수정은 지원하지 않습니다.</p>
      </div>

      <section className="admin-order-filter-card">
        <label>
          검색
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="주문 ID, 사용자명, 사용자 ID"
          />
        </label>
        <label>
          주문 상태
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as AdminOrderFilters['status'],
              }))
            }
          >
            {orderStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? '전체 상태' : orderStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <span className="soft-badge">
          {filteredOrders.length} / {orders.length}건
        </span>
      </section>

      {filteredOrders.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">주문 없음</span>
          <h2>조건에 맞는 주문이 없습니다.</h2>
          <p>사용자가 테스트 결제를 완료하면 이곳에 주문이 최신순으로 표시됩니다.</p>
        </section>
      ) : (
        <div className="admin-order-list">
          {filteredOrders.map((order) => (
            <AdminOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}
