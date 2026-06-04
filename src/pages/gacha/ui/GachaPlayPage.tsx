import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../shared/model/auth/useAuth';
import { getPlayableGacha } from '../api/getPlayableGacha';
import { performGachaDraw } from '../api/performGachaDraw';
import type { GachaDrawResult, GachaPlayable } from '../model/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function ProbabilityPanel({ product }: { product: GachaPlayable }) {
  return (
    <section className="info-card">
      <h2>현재 확률</h2>
      <p className="section-help">
        확률은 서버에 남아 있는 available 재고 기준이며, 다른 사용자의 뽑기 진행에 따라 바뀔 수
        있습니다.
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
    </section>
  );
}

function DrawLoading() {
  return (
    <section className="draw-loading-card" aria-live="polite">
      <div className="capsule-orbit" aria-hidden="true">
        <span />
      </div>
      <h2>서버에서 결과를 확정하는 중입니다.</h2>
      <p>가챠권과 재고를 잠그고 안전하게 추첨하고 있습니다.</p>
    </section>
  );
}

function DrawResultCard({
  result,
  hasMoreCredits,
  onDrawAgain,
  isPending,
}: {
  result: GachaDrawResult;
  hasMoreCredits: boolean;
  onDrawAgain: () => void;
  isPending: boolean;
}) {
  return (
    <section className="draw-result-card">
      <div className="draw-result-grade">
        <span>{result.rewardGrade}</span>
      </div>
      <div className="draw-result-content">
        <span className="soft-badge">서버 추첨 완료</span>
        <h2>{result.rewardName}</h2>
        <p>{result.rewardDescription ?? '당첨 상품 설명이 준비 중입니다.'}</p>
      </div>
      <dl className="draw-result-meta">
        <div>
          <dt>테마</dt>
          <dd>{result.themeName ?? '여러 테마'}</dd>
        </div>
        <div>
          <dt>추첨 일시</dt>
          <dd>{formatDate(result.createdAt)}</dd>
        </div>
        <div>
          <dt>검증 코드</dt>
          <dd>{result.publicVerifyCode.slice(0, 8)}</dd>
        </div>
        <div>
          <dt>추첨 ID</dt>
          <dd>{result.drawResultId.slice(0, 8)}</dd>
        </div>
      </dl>
      <p className="draw-verify-text">
        이 결과는 서버에서 안전한 추첨 로직으로 확정되었으며, 추첨 로그가 보관되었습니다.
      </p>
      <div className="draw-result-actions">
        <Link className="primary-link-button" to="/my/items">
          보관함으로 이동
        </Link>
        <button
          className={hasMoreCredits ? 'primary-cta' : 'disabled-cta'}
          type="button"
          disabled={!hasMoreCredits || isPending}
          onClick={onDrawAgain}
        >
          {hasMoreCredits ? '한 번 더 뽑기' : '남은 가챠권 없음'}
        </button>
      </div>
    </section>
  );
}

export function GachaPlayPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['playable-gacha', id, user?.id];

  const {
    data: product,
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey,
    queryFn: () => getPlayableGacha(id ?? '', user?.id ?? ''),
    enabled: Boolean(id && user?.id),
  });

  const drawMutation = useMutation({
    mutationFn: () => performGachaDraw(id ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ['my-draw-credits', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['gacha-product-detail', id] });
      void queryClient.invalidateQueries({ queryKey: ['gacha-products'] });
    },
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
    return <section className="state-card">뽑기 정보를 불러오는 중입니다.</section>;
  }

  if (isError) {
    return (
      <section className="state-card state-card-error">
        <strong>뽑기 정보를 불러오지 못했습니다.</strong>
        <span>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</span>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="state-card">
        <strong>가챠 상품을 찾을 수 없습니다.</strong>
        <Link className="text-link" to="/gacha">
          가챠 목록으로 이동
        </Link>
      </section>
    );
  }

  const hasCredits = product.unusedCreditCount > 0;
  const canDraw = hasCredits && product.availableInventoryCount > 0 && !drawMutation.isPending;
  const result = drawMutation.data;
  const remainingCreditsAfterResult = result
    ? Math.max(0, product.unusedCreditCount - 1)
    : product.unusedCreditCount;

  return (
    <section className="gacha-play-page">
      <div className="page-heading">
        <p className="section-label">Gacha Play</p>
        <h1>{product.title}</h1>
        <p>보유 가챠권을 사용해 서버에서 확정되는 추첨을 진행합니다.</p>
      </div>

      <section className="play-status-grid">
        <div className="play-status-card">
          <span className="summary-label">보유 가챠권</span>
          <strong>{product.unusedCreditCount}장</strong>
        </div>
        <div className="play-status-card">
          <span className="summary-label">남은 재고</span>
          <strong>{product.availableInventoryCount}개</strong>
        </div>
      </section>

      <ProbabilityPanel product={product} />

      {!hasCredits ? (
        <section className="empty-cart-card">
          <span className="soft-badge">가챠권 없음</span>
          <h2>사용 가능한 가챠권이 없습니다.</h2>
          <p>가챠 상세에서 장바구니에 담고 테스트 결제를 완료하면 가챠권이 발급됩니다.</p>
          <div className="checkout-complete-actions">
            <Link className="primary-link-button" to={`/gacha/${product.id}`}>
              가챠 상세로 이동
            </Link>
            <Link className="text-link-inline" to="/cart">
              장바구니로 이동
            </Link>
          </div>
        </section>
      ) : null}

      {drawMutation.isPending ? <DrawLoading /> : null}

      {drawMutation.isError ? (
        <section className="state-card state-card-error">
          <strong>추첨을 진행하지 못했습니다.</strong>
          <span>
            {drawMutation.error instanceof Error
              ? drawMutation.error.message
              : '요청이 몰려 추첨에 실패했습니다. 다시 시도해주세요.'}
          </span>
        </section>
      ) : null}

      {result ? (
        <DrawResultCard
          result={result}
          hasMoreCredits={remainingCreditsAfterResult > 0}
          isPending={drawMutation.isPending}
          onDrawAgain={() => drawMutation.mutate()}
        />
      ) : (
        <section className="fairness-card">
          <span className="soft-badge">공정성 안내</span>
          <h2>결과는 서버에서만 확정됩니다.</h2>
          <p>
            버튼을 누르면 서버 RPC가 사용 가능한 가챠권과 재고를 검증하고, 잠금 처리 후 결과와
            로그를 저장합니다. 클라이언트는 결과를 생성하지 않습니다.
          </p>
          <button
            className={canDraw ? 'primary-cta' : 'disabled-cta'}
            type="button"
            disabled={!canDraw}
            onClick={() => drawMutation.mutate()}
          >
            가챠 뽑기 시작
          </button>
        </section>
      )}
    </section>
  );
}
