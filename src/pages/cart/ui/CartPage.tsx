import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getDrawProductDisplayStatus } from '../../gacha/lib/getDrawProductDisplayStatus';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { calculateCartSummary } from '../lib/calculateCartSummary';
import { checkoutCart } from '../api/checkoutCart';
import { getCartItems } from '../api/getCartItems';
import { removeCartItem } from '../api/removeCartItem';
import { updateCartItemQuantity } from '../api/updateCartItemQuantity';
import type { CheckoutCartResult } from '../api/checkoutCart';
import type { CartItem } from '../model/types';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price);

function CartItemCard({
  item,
  isPending,
  onChangeQuantity,
  onRemove,
}: {
  item: CartItem;
  isPending: boolean;
  onChangeQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
}) {
  const displayStatus = getDrawProductDisplayStatus(
    item.product.status,
    item.product.availableInventoryCount,
  );
  const canDecrease = item.quantity > 1 && !isPending;
  const canIncrease =
    item.product.status === 'active' &&
    item.quantity < item.product.remainingPurchaseQuantity &&
    !isPending;

  return (
    <article className="cart-item-card">
      <div className="cart-item-main">
        <div>
          <div className="cart-item-title-row">
            <span className={`status-badge status-badge-${displayStatus.tone}`}>
              {displayStatus.label}
            </span>
            <span className="soft-badge">
              {item.product.scope === 'random' ? '랜덤 가챠' : '테마 가챠'}
            </span>
          </div>
          <h2>{item.product.title}</h2>
          <p>{item.product.themeName ?? '여러 테마'} · 가챠 이용권</p>
        </div>
        <strong>{formatPrice(item.product.price)}</strong>
      </div>

      <dl className="cart-item-meta">
        <div>
          <dt>구매 가능 수량</dt>
          <dd>{item.product.remainingPurchaseQuantity}개</dd>
        </div>
        <div>
          <dt>상품 합계</dt>
          <dd>{formatPrice(item.lineTotal)}</dd>
        </div>
      </dl>

      <div className="cart-item-actions">
        <div className="quantity-control" aria-label={`${item.product.title} 수량 변경`}>
          <button
            type="button"
            disabled={!canDecrease}
            onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
            aria-label="수량 감소"
          >
            -
          </button>
          <span>{item.quantity}</span>
          <button
            type="button"
            disabled={!canIncrease}
            onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
            aria-label="수량 증가"
          >
            +
          </button>
        </div>
        <button
          className="text-button"
          type="button"
          disabled={isPending}
          onClick={() => onRemove(item.id)}
        >
          삭제
        </button>
      </div>
    </article>
  );
}

export function CartPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['cart-items', user?.id];
  const [checkoutResult, setCheckoutResult] = useState<CheckoutCartResult | null>(null);

  const {
    data: items = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey,
    queryFn: () => getCartItems(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: updateCartItemQuantity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const checkoutMutation = useMutation({
    mutationFn: checkoutCart,
    onSuccess: (result) => {
      setCheckoutResult(result);
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ['my-draw-credits', user?.id] });
    },
  });

  const mutationError =
    updateQuantityMutation.error instanceof Error
      ? updateQuantityMutation.error.message
      : removeMutation.error instanceof Error
        ? removeMutation.error.message
        : checkoutMutation.error instanceof Error
          ? checkoutMutation.error.message
          : null;

  const summary = calculateCartSummary(items);
  const isPending =
    updateQuantityMutation.isPending || removeMutation.isPending || checkoutMutation.isPending;
  const canCheckout = items.length > 0 && !isPending;

  if (isLoading) {
    return <section className="state-card">장바구니를 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>장바구니를 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="page-heading">
        <p className="section-label">Cart</p>
        <h1>장바구니</h1>
        <p>구매할 가챠 이용권을 확인하고 수량을 조정하세요.</p>
      </div>

      {mutationError ? (
        <section className="state-card state-card-error">
          <strong>요청을 처리하지 못했습니다.</strong>
          <span>{mutationError}</span>
        </section>
      ) : null}

      {checkoutResult ? (
        <section className="checkout-complete-card">
          <span className="soft-badge">테스트 결제 완료</span>
          <h2>가챠권 {checkoutResult.issuedCreditCount}장이 발급되었습니다.</h2>
          <p>
            주문이 결제 완료 상태로 생성되었고, 보유 가챠권에서 바로 확인할 수 있습니다.
          </p>
          <dl>
            <div>
              <dt>주문 번호</dt>
              <dd>{checkoutResult.orderId.slice(0, 8)}</dd>
            </div>
            <div>
              <dt>결제 금액</dt>
              <dd>{formatPrice(checkoutResult.totalAmount)}</dd>
            </div>
          </dl>
          <div className="checkout-complete-actions">
            <Link className="primary-link-button" to="/my/draws">
              보유 가챠권 보기
            </Link>
            <Link className="text-link-inline" to="/gacha">
              가챠 더 보기
            </Link>
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">비어 있음</span>
          <h2>아직 담긴 가챠가 없습니다.</h2>
          <p>관심 있는 가챠를 둘러보고 장바구니에 담아보세요.</p>
          <Link className="primary-link-button" to="/gacha">
            가챠 보러가기
          </Link>
        </section>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                isPending={isPending}
                onChangeQuantity={(cartItemId, quantity) =>
                  updateQuantityMutation.mutate({ cartItemId, quantity })
                }
                onRemove={(cartItemId) => removeMutation.mutate(cartItemId)}
              />
            ))}
          </div>

          <aside className="cart-summary-card">
            <span className="summary-label">결제 예정</span>
            <dl>
              <div>
                <dt>총 상품 수량</dt>
                <dd>{summary.totalQuantity}개</dd>
              </div>
              <div>
                <dt>총 결제 예정 금액</dt>
                <dd>{formatPrice(summary.totalAmount)}</dd>
              </div>
            </dl>
            <button
              className="primary-cta"
              type="button"
              disabled={!canCheckout}
              onClick={() => checkoutMutation.mutate()}
            >
              {checkoutMutation.isPending ? '결제 처리 중' : '테스트 결제 완료'}
            </button>
            <p>
              실제 PG 결제 없이 주문을 결제 완료로 만들고, 구매 수량만큼 가챠권을 발급합니다.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
