import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAdminGachaProduct } from '../api/createAdminGachaProduct';
import { getAdminGachaProducts } from '../api/getAdminGachaProducts';
import { getAdminRewardThemes } from '../api/getAdminRewardThemes';
import { uploadAdminDrawProductImage } from '../api/uploadAdminDrawProductImage';
import { updateAdminGachaProduct } from '../api/updateAdminGachaProduct';
import {
  defaultSquareImageCrop,
  drawSquareImageToCanvas,
  type SquareImageCrop,
} from '../lib/createSquareImageBlob';
import { getAdminGachaStatus, rawGachaStatusLabels } from '../lib/gachaStatus';
import { formatCurrency } from '../lib/orderStatus';
import type {
  AdminGachaFilters,
  AdminGachaProduct,
  AdminGachaProductFormInput,
  AdminGachaProductMutationInput,
} from '../model/gachaTypes';
import type { DrawProductStatus } from '../../gacha/model/types';
import type { AdminRewardThemeOption } from '../model/rewardItemTypes';

const statusOptions: Array<DrawProductStatus | 'all'> = [
  'all',
  'draft',
  'active',
  'sold_out',
  'hidden',
  'archived',
];
const formStatusOptions: DrawProductStatus[] = ['draft', 'active', 'sold_out', 'hidden', 'archived'];
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 5 * 1024 * 1024;

type GachaFormSubmitInput = AdminGachaProductMutationInput & {
  imageFile: File | null;
  imageCrop: SquareImageCrop;
};

type ImageDragState = {
  pointerId: number;
  x: number;
  y: number;
};

const emptyFormInput: AdminGachaProductFormInput = {
  title: '',
  themeId: '',
  description: '',
  imageUrl: '',
  price: '',
  creditAmount: '1',
  salesLimit: '100',
  status: 'draft',
};

function shortId(value: string) {
  return value.slice(0, 8);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
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

function createFormInputFromProduct(product: AdminGachaProduct): AdminGachaProductFormInput {
  return {
    id: product.id,
    title: product.title,
    themeId: product.themeId ?? '',
    description: product.description ?? '',
    imageUrl: product.imageUrl ?? '',
    price: String(product.price),
    creditAmount: String(product.creditAmount),
    salesLimit: String(product.salesLimit),
    status: product.status,
  };
}

function parseNonNegativeInteger(value: string) {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value);
}

function validateGachaForm(input: AdminGachaProductFormInput, soldCount = 0) {
  if (!input.themeId) return '테마를 선택해주세요.';
  if (!input.title.trim()) return '가챠명을 입력해주세요.';

  const price = parseNonNegativeInteger(input.price);
  if (price === null) return '가격은 0원 이상 숫자로 입력해주세요.';

  const creditAmount = parseNonNegativeInteger(input.creditAmount);
  if (creditAmount === null || creditAmount < 1) {
    return '지급 가챠권 수량은 1개 이상이어야 합니다.';
  }

  const salesLimit = parseNonNegativeInteger(input.salesLimit);
  if (salesLimit === null || salesLimit < 1) {
    return '판매 제한 수량은 1개 이상이어야 합니다.';
  }

  if (salesLimit < soldCount) {
    return '판매 제한 수량은 이미 판매된 가챠권 수보다 작을 수 없습니다.';
  }

  if (!input.status) return '상태를 선택해주세요.';

  return null;
}

function toMutationInput(input: AdminGachaProductFormInput): AdminGachaProductMutationInput {
  return {
    id: input.id,
    title: input.title.trim(),
    themeId: input.themeId,
    description: input.description.trim() || null,
    imageUrl: input.imageUrl.trim() || null,
    price: Number(input.price),
    creditAmount: Number(input.creditAmount),
    salesLimit: Number(input.salesLimit),
    status: input.status,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampImageCrop(crop: SquareImageCrop): SquareImageCrop {
  return {
    zoom: clamp(crop.zoom, 1, 3),
    offsetX: clamp(crop.offsetX, -100, 100),
    offsetY: clamp(crop.offsetY, -100, 100),
  };
}

function AdminGachaForm({
  initialValue,
  themes,
  isSaving,
  submitLabel,
  soldCount = 0,
  onSubmit,
}: {
  initialValue: AdminGachaProductFormInput;
  themes: AdminRewardThemeOption[];
  isSaving: boolean;
  submitLabel: string;
  soldCount?: number;
  onSubmit: (input: GachaFormSubmitInput) => void;
}) {
  const [input, setInput] = useState(initialValue);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialValue.imageUrl);
  const [imageCrop, setImageCrop] = useState<SquareImageCrop>(defaultSquareImageCrop);
  const [imageError, setImageError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageDragRef = useRef<ImageDragState | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (!imageFile || !imagePreviewUrl) return;

    let isActive = true;
    const image = new Image();

    image.onload = () => {
      if (!isActive) return;

      const canvas = previewCanvasRef.current;
      const context = canvas?.getContext('2d');

      if (!canvas || !context) return;

      canvas.width = 800;
      canvas.height = 800;
      drawSquareImageToCanvas(context, image, imageCrop);
    };

    image.onerror = () => {
      if (isActive) {
        setImageError('이미지를 불러오지 못했습니다. 대표 이미지를 다시 선택해주세요.');
      }
    };

    image.src = imagePreviewUrl;

    return () => {
      isActive = false;
    };
  }, [imageCrop, imageFile, imagePreviewUrl]);

  function handleImageChange(fileList: FileList | null) {
    const file = fileList?.[0];

    setImageError(null);

    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(initialValue.imageUrl);
      setImageCrop(defaultSquareImageCrop);
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      setImageFile(null);
      setImageError('지원하지 않는 이미지 형식입니다.');
      return;
    }

    if (file.size > maxImageSize) {
      setImageFile(null);
      setImageError('이미지 파일은 최대 5MB까지 업로드할 수 있습니다.');
      return;
    }

    if (imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImageCrop(defaultSquareImageCrop);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleImageWheel(event: ReactWheelEvent<HTMLCanvasElement>) {
    if (!imageFile) return;

    event.preventDefault();
    const zoomDelta = event.deltaY < 0 ? 0.08 : -0.08;
    setImageCrop((current) =>
      clampImageCrop({
        ...current,
        zoom: current.zoom + zoomDelta,
      }),
    );
  }

  function handleImagePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!imageFile) return;

    event.preventDefault();
    imageDragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleImagePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const dragState = imageDragRef.current;

    if (!imageFile || !dragState || dragState.pointerId !== event.pointerId) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const deltaX = ((event.clientX - dragState.x) / rect.width) * 200;
    const deltaY = ((event.clientY - dragState.y) / rect.height) * 200;

    setImageCrop((current) =>
      clampImageCrop({
        ...current,
        offsetX: current.offsetX + deltaX,
        offsetY: current.offsetY + deltaY,
      }),
    );

    imageDragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handleImagePointerEnd(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (imageDragRef.current?.pointerId === event.pointerId) {
      imageDragRef.current = null;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <form
      className="admin-gacha-form"
      onSubmit={(event) => {
        event.preventDefault();
        const error = validateGachaForm(input, soldCount);
        setValidationError(error);
        if (error || imageError) return;
        onSubmit({ ...toMutationInput(input), imageFile, imageCrop });
      }}
    >
      <div className="admin-gacha-image-field">
        <span>대표 이미지</span>
        <input
          className="admin-gacha-image-input"
          id={`gacha-image-${initialValue.id ?? 'new'}`}
          type="file"
          accept={allowedImageTypes.join(',')}
          onChange={(event) => handleImageChange(event.target.files)}
        />
        <div className="admin-gacha-image-upload-row">
          <label className="admin-gacha-image-upload-button" htmlFor={`gacha-image-${initialValue.id ?? 'new'}`}>
            이미지 업로드
          </label>
          {imageFile ? <span className="soft-badge">{imageFile.name}</span> : null}
        </div>
        <div className="admin-gacha-image-preview" aria-label="가챠 대표 이미지 정사각형 미리보기">
          {imageFile ? (
            <canvas
              ref={previewCanvasRef}
              aria-label="조정된 가챠 대표 이미지 미리보기"
              onPointerDown={handleImagePointerDown}
              onPointerMove={handleImagePointerMove}
              onPointerUp={handleImagePointerEnd}
              onPointerCancel={handleImagePointerEnd}
              onLostPointerCapture={handleImagePointerEnd}
              onWheel={handleImageWheel}
            />
          ) : imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="가챠 대표 이미지 미리보기" />
          ) : (
            <span>이미지를 선택하면 정사각형으로 미리볼 수 있습니다.</span>
          )}
        </div>
        {imageFile ? (
          <p className="admin-gacha-image-help">
            미리보기를 드래그해서 위치를 조정하고, 마우스 휠로 확대/축소할 수 있습니다. 현재 확대율 {Math.round(imageCrop.zoom * 100)}%
          </p>
        ) : null}
        <small>대표 이미지는 선택 사항입니다. 선택한 이미지는 위 미리보기와 같은 위치/크기로 저장됩니다.</small>
        {imageError ? <p className="admin-maintenance-error">{imageError}</p> : null}
      </div>
      <label>
        테마
        <select
          value={input.themeId}
          onChange={(event) => setInput((current) => ({ ...current, themeId: event.target.value }))}
        >
          <option value="">테마를 선택해주세요</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        가챠명
        <input
          value={input.title}
          onChange={(event) => setInput((current) => ({ ...current, title: event.target.value }))}
          placeholder="예: 원피스 랜덤 가챠 1회권"
        />
      </label>
      <label>
        가격
        <input
          type="number"
          min="0"
          step="1"
          value={input.price}
          onChange={(event) => setInput((current) => ({ ...current, price: event.target.value }))}
          placeholder="예: 5000"
        />
      </label>
      <label>
        지급 가챠권 수량
        <input
          type="number"
          min="1"
          step="1"
          value={input.creditAmount}
          onChange={(event) =>
            setInput((current) => ({ ...current, creditAmount: event.target.value }))
          }
        />
      </label>
      <label>
        판매 제한 수량
        <input
          type="number"
          min="1"
          step="1"
          value={input.salesLimit}
          onChange={(event) =>
            setInput((current) => ({ ...current, salesLimit: event.target.value }))
          }
        />
      </label>
      <label>
        상태
        <select
          value={input.status}
          onChange={(event) =>
            setInput((current) => ({
              ...current,
              status: event.target.value as DrawProductStatus,
            }))
          }
        >
          {formStatusOptions.map((status) => (
            <option key={status} value={status}>
              {rawGachaStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-gacha-form-wide">
        설명
        <textarea
          value={input.description}
          onChange={(event) =>
            setInput((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="가챠 상품 설명을 입력해주세요."
          rows={3}
        />
      </label>
      <p className="admin-gacha-form-note">
        판매된 가챠권 수량은 직접 수정할 수 없습니다. 구매와 미사용 환불 처리 흐름에서만 자동 변경됩니다.
      </p>
      {validationError ? <p className="admin-maintenance-error">{validationError}</p> : null}
      <div className="admin-gacha-form-actions">
        <button className={isSaving ? 'disabled-cta' : 'primary-cta'} type="submit" disabled={isSaving}>
          {isSaving ? '저장 중' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function AdminGachaCard({
  product,
  themes,
  isSaving,
  onUpdate,
}: {
  product: AdminGachaProduct;
  themes: AdminRewardThemeOption[];
  isSaving: boolean;
  onUpdate: (productId: string, input: GachaFormSubmitInput) => void;
}) {
  const status = getAdminGachaStatus(product.status, product.availableInventoryCount);

  return (
    <article className="admin-gacha-card">
      <div className="admin-gacha-image-card">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={`${product.title} 대표 이미지`} />
        ) : (
          <span>대표 이미지 없음</span>
        )}
      </div>
      <div className="admin-gacha-header">
        <div>
          <div className="cart-item-title-row">
            <span className={`status-badge status-badge-${status.tone}`}>{status.label}</span>
            <span className="soft-badge">원본 상태: {status.rawLabel}</span>
            <span className="soft-badge">테마: {product.themeName ?? '미지정'}</span>
            <span className="soft-badge">수정 가능</span>
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
          <dd>{product.themeName ?? '미지정'}</dd>
        </div>
        <div>
          <dt>지급 가챠권</dt>
          <dd>{product.creditAmount}개</dd>
        </div>
        <div>
          <dt>판매된 가챠권</dt>
          <dd>
            {product.soldCount} / {product.salesLimit}
          </dd>
        </div>
        <div>
          <dt>신규 구매 가능 수량</dt>
          <dd>{product.remainingPurchaseQuantity}</dd>
        </div>
        <div>
          <dt>미추첨 재고</dt>
          <dd>{product.availableInventoryCount}</dd>
        </div>
        <div>
          <dt>전체 재고</dt>
          <dd>{product.totalInventoryCount}</dd>
        </div>
        <div>
          <dt>수정일</dt>
          <dd>{formatDate(product.updatedAt)}</dd>
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

      <details className="admin-gacha-edit-panel">
        <summary>가챠 상품 정보 수정</summary>
        <AdminGachaForm
          key={`${product.id}-${product.updatedAt}`}
          initialValue={createFormInputFromProduct(product)}
          themes={themes}
          isSaving={isSaving}
          submitLabel="가챠 상품 저장"
          soldCount={product.soldCount}
          onSubmit={(input) => onUpdate(product.id, input)}
        />
      </details>
    </article>
  );
}

export function AdminGachaPage() {
  const queryClient = useQueryClient();
  const [createFormVersion, setCreateFormVersion] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const {
    data: themes = [],
    error: themesError,
    isError: isThemesError,
    isLoading: isThemesLoading,
  } = useQuery({
    queryKey: ['admin-reward-themes'],
    queryFn: getAdminRewardThemes,
  });

  const createMutation = useMutation({
    mutationFn: async (input: GachaFormSubmitInput) => {
      const drawProductId = crypto.randomUUID();
      const imageUrl = input.imageFile
        ? await uploadAdminDrawProductImage(drawProductId, input.imageFile, input.imageCrop)
        : input.imageUrl;

      return createAdminGachaProduct({
        ...input,
        id: drawProductId,
        imageUrl,
      });
    },
    onSuccess: () => {
      setCreateFormVersion((current) => current + 1);
      setIsCreateModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-gacha-products'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, input }: { productId: string; input: GachaFormSubmitInput }) => {
      const imageUrl = input.imageFile
        ? await uploadAdminDrawProductImage(productId, input.imageFile, input.imageCrop)
        : input.imageUrl;

      return updateAdminGachaProduct({ id: productId, ...input, imageUrl });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-gacha-products'] });
    },
  });

  const themeOptions = useMemo(() => themes.map((theme) => [theme.id, theme.name] as const), [themes]);

  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [filters, products],
  );

  if (isLoading || isThemesLoading) {
    return <section className="state-card">가챠 상품을 불러오는 중입니다.</section>;
  }

  if (isError || isThemesError) {
    return (
      <section className="state-card state-card-error">
        <strong>가챠 상품을 불러오지 못했습니다.</strong>
        <span>
          {error instanceof Error
            ? error.message
            : themesError instanceof Error
              ? themesError.message
              : '알 수 없는 오류가 발생했습니다.'}
        </span>
      </section>
    );
  }

  return (
    <section className="admin-gacha-page">
      <div className="page-heading">
        <p className="section-label">관리자 · 가챠 상품</p>
        <h1>가챠 상품 관리</h1>
        <p>가챠 상품 메타데이터를 생성하고 수정합니다. 상품 풀 구성과 재고 생성은 별도 단계에서 처리합니다.</p>
      </div>

      <div className="admin-gacha-toolbar">
        <button
          className="primary-cta"
          type="button"
          onClick={() => {
            createMutation.reset();
            setIsCreateModalOpen(true);
          }}
        >
          가챠 상품 추가
        </button>
        {createMutation.isSuccess ? (
          <p className="admin-maintenance-result">가챠 상품을 추가했습니다.</p>
        ) : null}
      </div>

      {isCreateModalOpen ? (
        <div className="admin-gacha-modal-backdrop" role="presentation">
          <section
            className="admin-gacha-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-gacha-create-title"
          >
            <div className="admin-gacha-modal-header">
              <div>
                <p className="section-label">가챠 상품 추가</p>
                <h2 id="admin-gacha-create-title">새 가챠 상품 등록</h2>
                <p>가챠 상품의 판매 정보만 등록합니다. 구성 상품과 재고는 다음 단계에서 연결합니다.</p>
              </div>
              <button
                className="text-button"
                type="button"
                disabled={createMutation.isPending}
                onClick={() => setIsCreateModalOpen(false)}
              >
                닫기
              </button>
            </div>
            <AdminGachaForm
              key={createFormVersion}
              initialValue={emptyFormInput}
              themes={themes}
              isSaving={createMutation.isPending}
              submitLabel="가챠 상품 추가"
              onSubmit={(input) => createMutation.mutate(input)}
            />
            {createMutation.isError ? (
              <p className="admin-maintenance-error">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : '가챠 상품을 추가하지 못했습니다.'}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {updateMutation.isError ? (
        <section className="state-card state-card-error">
          <strong>가챠 상품을 수정하지 못했습니다.</strong>
          <span>
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : '알 수 없는 오류가 발생했습니다.'}
          </span>
        </section>
      ) : null}

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
            <option value="has_available">미추첨 재고 있음</option>
            <option value="no_available">미추첨 재고 없음</option>
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
            <AdminGachaCard
              key={product.id}
              product={product}
              themes={themes}
              isSaving={updateMutation.isPending && updateMutation.variables?.productId === product.id}
              onUpdate={(productId, input) => updateMutation.mutate({ productId, input })}
            />
          ))}
        </div>
      )}
    </section>
  );
}
