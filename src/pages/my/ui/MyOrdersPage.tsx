import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { getMyOrders } from '../api/getMyOrders';
import type { MyOrder, MyOrderStatus } from '../model/types';

const orderStatusLabels: Record<MyOrderStatus, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  canceled: '취소됨',
  refund_requested: '환불 요청',
  refunded: '환불 완료',
};

function getOrderStatusTone(status: MyOrderStatus) {
  if (status === 'paid') return 'success';
  if (status === 'refund_requested') return 'warning';
  if (status === 'canceled' || status === 'refunded') return 'muted';
  return 'warning';
}

const refundStatusLabels: Record<string, string> = {
  requested: '요청됨',
  approved: '승인됨',
  rejected: '거절됨',
  canceled: '취소됨',
  processed: '환불 완료',
};

const creditStatusLabels = {
  unused: '사용 가능',
  used: '사용 완료',
  expired: '만료됨',
  refunded: '환불됨',
  failed: '발급 실패',
} as const;

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function MyOrderCard({ order }: { order: MyOrder }) {
  return (
    <article className="my-order-card">
      <div className="admin-order-header">
        <div>
          <div className="cart-item-title-row">
            <span className={`item-status-badge item-status-${getOrderStatusTone(order.status)}`}>
              {orderStatusLabels[order.status]}
            </span>
            <span className="soft-badge">주문 #{shortId(order.id)}</span>
          </div>
          <h2>{formatCurrency(order.totalAmount)}</h2>
          <p>주문일 {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <dl className="admin-order-summary">
        <div>
          <dt>결제 완료일</dt>
          <dd>{formatDate(order.paidAt)}</dd>
        </div>
        <div>
          <dt>주문 상품</dt>
          <dd>{order.items.length}개</dd>
        </div>
        <div>
          <dt>발급 가챠권</dt>
          <dd>{order.totalIssuedQuantity}개</dd>
        </div>
        <div>
          <dt>환불 요청</dt>
          <dd>{order.refundRequests.length}건</dd>
        </div>
      </dl>

      <details className="order-detail-panel">
        <summary>주문 상세 보기</summary>
        <section>
          <h3>주문 기본 정보</h3>
          <dl className="order-detail-meta">
            <div>
              <dt>주문 ID</dt>
              <dd>{order.id}</dd>
            </div>
            <div>
              <dt>주문 상태</dt>
              <dd>{orderStatusLabels[order.status]}</dd>
            </div>
            <div>
              <dt>주문일</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt>결제 완료일</dt>
              <dd>{formatDate(order.paidAt)}</dd>
            </div>
            <div>
              <dt>취소일</dt>
              <dd>{formatDate(order.canceledAt)}</dd>
            </div>
          </dl>
        </section>

        <section>
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

        <section>
          <h3>가챠권 발급 상태</h3>
          <dl className="order-credit-summary">
            <div>
              <dt>전체</dt>
              <dd>{order.creditSummary.total}</dd>
            </div>
            <div>
              <dt>{creditStatusLabels.unused}</dt>
              <dd>{order.creditSummary.unused}</dd>
            </div>
            <div>
              <dt>{creditStatusLabels.used}</dt>
              <dd>{order.creditSummary.used}</dd>
            </div>
            <div>
              <dt>{creditStatusLabels.refunded}</dt>
              <dd>{order.creditSummary.refunded}</dd>
            </div>
            <div>
              <dt>{creditStatusLabels.expired}</dt>
              <dd>{order.creditSummary.expired}</dd>
            </div>
          </dl>
        </section>

        {order.refundRequests.length > 0 ? (
          <section>
            <h3>환불 요청</h3>
            <div className="admin-user-mini-list">
              {order.refundRequests.map((request) => (
                <div key={request.id}>
                  <strong>환불 요청 #{shortId(request.id)}</strong>
                  <span>
                    {refundStatusLabels[request.status] ?? request.status} · 요청일{' '}
                    {formatDate(request.requestedAt)} · 처리일 {formatDate(request.processedAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <h3>환불 요청</h3>
            <p className="order-detail-note">이 주문에 연결된 환불 요청이 없습니다.</p>
          </section>
        )}
      </details>
    </article>
  );
}

export function MyOrdersPage() {
  const { user } = useAuth();
  const {
    data: orders = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: () => getMyOrders(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });

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
    <section className="my-orders-page">
      <div className="page-heading">
        <p className="section-label">마이페이지 · 주문</p>
        <h1>주문 내역</h1>
        <p>테스트 결제로 생성된 주문과 발급된 가챠권 수량을 확인할 수 있습니다.</p>
      </div>

      {orders.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">주문 없음</span>
          <h2>아직 주문 내역이 없습니다.</h2>
          <p>가챠 상품을 장바구니에 담고 테스트 결제를 완료하면 주문이 생성됩니다.</p>
          <Link className="primary-link-button" to="/gacha">
            가챠 보러가기
          </Link>
        </section>
      ) : (
        <div className="my-order-list">
          {orders.map((order) => (
            <MyOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}
