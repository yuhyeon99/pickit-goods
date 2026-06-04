import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { getMyDrawResults } from '../../my/api/getMyDrawResults';
import { createClaimRequest } from '../api/createClaimRequest';
import type { ClaimMethod } from '../../my/model/types';

type DeliveryForm = {
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  address1: string;
  address2: string;
  deliveryNote: string;
};

const initialDeliveryForm: DeliveryForm = {
  recipientName: '',
  recipientPhone: '',
  postalCode: '',
  address1: '',
  address2: '',
  deliveryNote: '',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

export function ClaimPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [claimMethod, setClaimMethod] = useState<ClaimMethod>('delivery');
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>(initialDeliveryForm);

  const {
    data: allItems = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['my-draw-results', user?.id],
    queryFn: () => getMyDrawResults(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });

  const claimableItems = useMemo(
    () => allItems.filter((item) => item.status === 'completed' && !item.isClaimRequested),
    [allItems],
  );

  const isDeliveryFormComplete =
    deliveryForm.recipientName.trim().length > 0 &&
    deliveryForm.recipientPhone.trim().length > 0 &&
    deliveryForm.postalCode.trim().length > 0 &&
    deliveryForm.address1.trim().length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      createClaimRequest({
        drawResultIds: selectedIds,
        claimMethod,
        recipientName: deliveryForm.recipientName,
        recipientPhone: deliveryForm.recipientPhone,
        postalCode: deliveryForm.postalCode,
        address1: deliveryForm.address1,
        address2: deliveryForm.address2,
        deliveryNote: deliveryForm.deliveryNote,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-draw-results', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['my-claim-requests', user?.id] });
    },
  });

  const toggleSelected = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  };

  const canSubmit =
    selectedIds.length > 0 &&
    !mutation.isPending &&
    (claimMethod === 'pickup' || isDeliveryFormComplete);

  if (isLoading) {
    return <section className="state-card">수령 요청 가능한 상품을 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>수령 요청 정보를 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  if (mutation.data) {
    return (
      <section className="claim-page">
        <section className="checkout-complete-card">
          <span className="soft-badge">수령 요청 완료</span>
          <h1>상품 {mutation.data.itemCount}개의 수령 요청이 접수되었습니다.</h1>
          <p>관리자가 확인한 뒤 준비 상태를 변경합니다.</p>
          {mutation.data.pickupQrCode ? (
            <dl>
              <div>
                <dt>수령 코드</dt>
                <dd>{mutation.data.pickupQrCode}</dd>
              </div>
            </dl>
          ) : null}
          <div className="checkout-complete-actions">
            <Link className="primary-link-button" to="/my/claims">
              수령 요청 내역 보기
            </Link>
            <Link className="text-link-inline" to="/my/items">
              보관함으로 이동
            </Link>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="claim-page">
      <div className="page-heading">
        <p className="section-label">Claim Request</p>
        <h1>수령 요청</h1>
        <p>보관중인 당첨 상품을 선택해 배송 또는 현장 수령을 요청할 수 있습니다.</p>
      </div>

      {claimableItems.length === 0 ? (
        <section className="empty-cart-card">
          <span className="soft-badge">요청 가능 상품 없음</span>
          <h2>수령 요청할 수 있는 보관 상품이 없습니다.</h2>
          <p>가챠 추첨 결과가 보관중 상태이고 아직 수령 요청되지 않은 경우에만 표시됩니다.</p>
          <Link className="primary-link-button" to="/my/items">
            보관함 보기
          </Link>
        </section>
      ) : (
        <>
          <section className="claim-section-card">
            <div className="section-heading-row">
              <div>
                <p className="section-label">Items</p>
                <h2>상품 선택</h2>
              </div>
              <span className="soft-badge">{selectedIds.length}개 선택</span>
            </div>
            <div className="claim-item-grid">
              {claimableItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    className={`claim-select-card ${isSelected ? 'claim-select-card-active' : ''}`}
                    type="button"
                    onClick={() => toggleSelected(item.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="grade-badge">{item.grade}</span>
                    <strong>{item.rewardName}</strong>
                    <small>
                      {item.themeName ?? '여러 테마'} · {formatDate(item.createdAt)}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="claim-section-card">
            <div className="section-heading-row">
              <div>
                <p className="section-label">Method</p>
                <h2>수령 방식</h2>
              </div>
            </div>
            <div className="claim-method-grid">
              <button
                className={`claim-method-card ${claimMethod === 'delivery' ? 'claim-method-card-active' : ''}`}
                type="button"
                onClick={() => setClaimMethod('delivery')}
              >
                <strong>배송 수령</strong>
                <span>주소와 연락처를 입력해 배송 준비를 요청합니다.</span>
              </button>
              <button
                className={`claim-method-card ${claimMethod === 'pickup' ? 'claim-method-card-active' : ''}`}
                type="button"
                onClick={() => setClaimMethod('pickup')}
              >
                <strong>현장 수령</strong>
                <span>준비 완료 후 수령 코드로 현장에서 수령합니다.</span>
              </button>
            </div>
          </section>

          {claimMethod === 'delivery' ? (
            <section className="claim-section-card">
              <div className="section-heading-row">
                <div>
                  <p className="section-label">Shipping</p>
                  <h2>배송 정보</h2>
                </div>
              </div>
              <div className="claim-form-grid">
                <label>
                  수령자 이름
                  <input
                    required
                    value={deliveryForm.recipientName}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        recipientName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  연락처
                  <input
                    required
                    type="tel"
                    value={deliveryForm.recipientPhone}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        recipientPhone: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  우편번호
                  <input
                    required
                    inputMode="numeric"
                    value={deliveryForm.postalCode}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        postalCode: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  주소
                  <input
                    required
                    value={deliveryForm.address1}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        address1: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  상세 주소
                  <input
                    value={deliveryForm.address2}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        address2: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  배송 요청사항
                  <textarea
                    value={deliveryForm.deliveryNote}
                    onChange={(event) =>
                      setDeliveryForm((current) => ({
                        ...current,
                        deliveryNote: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </section>
          ) : (
            <section className="claim-section-card">
              <span className="soft-badge">현장 수령 안내</span>
              <h2>관리자 준비 완료 후 수령할 수 있습니다.</h2>
              <p>
                수령 요청이 접수되면 수령 코드가 생성됩니다. 준비 완료 상태가 되면 현장에서
                QR 또는 수령 코드를 제시해주세요. 수령 장소와 시간은 추후 안내됩니다.
              </p>
            </section>
          )}

          {mutation.isError ? (
            <section className="state-card state-card-error">
              <strong>수령 요청을 생성하지 못했습니다.</strong>
              <span>
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : '알 수 없는 오류가 발생했습니다.'}
              </span>
            </section>
          ) : null}

          <section className="sticky-cta-card">
            <div>
              <strong>선택 상품 {selectedIds.length}개</strong>
              <span>
                {claimMethod === 'delivery'
                  ? '배송 수령 필수 정보를 입력하면 요청할 수 있습니다.'
                  : '현장 수령 코드가 생성됩니다.'}
              </span>
            </div>
            <button
              className={canSubmit ? 'primary-cta' : 'disabled-cta'}
              type="button"
              disabled={!canSubmit}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? '요청 중' : '수령 요청하기'}
            </button>
          </section>
        </>
      )}
    </section>
  );
}
