import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAdminRewardItem } from '../api/createAdminRewardItem';
import { getAdminRewardItems } from '../api/getAdminRewardItems';
import { getAdminRewardThemes } from '../api/getAdminRewardThemes';
import { uploadAdminRewardItemImage } from '../api/uploadAdminRewardItemImage';
import { updateAdminRewardItem } from '../api/updateAdminRewardItem';
import { getAdminGachaStatus } from '../lib/gachaStatus';
import { formatCurrency } from '../lib/orderStatus';
import { inventoryStatusLabels, inventoryStatusOrder, rewardItemStatusLabels } from '../lib/rewardGrade';
import type {
  AdminRewardItem,
  AdminRewardItemFilters,
  AdminRewardItemFormInput,
  AdminRewardItemStatus,
  AdminRewardThemeOption,
} from '../model/rewardItemTypes';
import type { RewardGrade } from '../../gacha/model/types';

const gradeOptions: Array<RewardGrade | 'all'> = ['all', 'S', 'A', 'B', 'C'];
const formGradeOptions: RewardGrade[] = ['S', 'A', 'B', 'C'];
const rewardStatusOptions: AdminRewardItemStatus[] = ['active', 'hidden', 'archived'];
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 5 * 1024 * 1024;

type RewardItemFormSubmitInput = AdminRewardItemFormInput & {
  imageFile: File | null;
};

const emptyFormInput: AdminRewardItemFormInput = {
  name: '',
  description: '',
  grade: '',
  themeId: '',
  category: '',
  status: 'active',
  imageUrl: '',
};

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

function createFormInputFromItem(item: AdminRewardItem): AdminRewardItemFormInput {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    grade: item.grade,
    themeId: item.themeId ?? '',
    category: item.category,
    status: item.status,
    imageUrl: item.imageUrl ?? '',
  };
}

function validateRewardItemForm(input: AdminRewardItemFormInput) {
  if (!input.name.trim()) return '상품명을 입력해주세요.';
  if (!input.grade) return '등급을 선택해주세요.';
  if (!input.themeId) return '테마를 선택해주세요.';
  if (!input.category.trim()) return '카테고리를 입력해주세요.';
  if (!input.status) return '상태를 선택해주세요.';

  return null;
}

function RewardItemForm({
  initialValue,
  themes,
  isSaving,
  submitLabel,
  onSubmit,
}: {
  initialValue: AdminRewardItemFormInput;
  themes: AdminRewardThemeOption[];
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (input: RewardItemFormSubmitInput) => void;
}) {
  const [input, setInput] = useState(initialValue);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialValue.imageUrl);
  const [imageError, setImageError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function handleImageChange(fileList: FileList | null) {
    const file = fileList?.[0];

    setImageError(null);

    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(initialValue.imageUrl);
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
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  return (
    <form
      className="admin-reward-form"
      onSubmit={(event) => {
        event.preventDefault();
        const error = validateRewardItemForm(input);
        setValidationError(error);
        if (error || imageError) return;
        onSubmit({ ...input, imageFile });
      }}
    >
      <label>
        상품명
        <input
          value={input.name}
          onChange={(event) => setInput((current) => ({ ...current, name: event.target.value }))}
          placeholder="예: A급 아크릴 스탠드"
        />
      </label>
      <label>
        등급
        <select
          value={input.grade}
          onChange={(event) =>
            setInput((current) => ({ ...current, grade: event.target.value as RewardGrade }))
          }
        >
          <option value="">등급 선택</option>
          {formGradeOptions.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </label>
      <label>
        테마
        <select
          value={input.themeId}
          onChange={(event) => setInput((current) => ({ ...current, themeId: event.target.value }))}
        >
          <option value="">테마 선택</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name} · {rewardItemStatusLabels[theme.status]}
            </option>
          ))}
        </select>
      </label>
      <label>
        카테고리
        <input
          value={input.category}
          onChange={(event) => setInput((current) => ({ ...current, category: event.target.value }))}
          placeholder="예: 굿즈"
        />
      </label>
      <label>
        상태
        <select
          value={input.status}
          onChange={(event) =>
            setInput((current) => ({
              ...current,
              status: event.target.value as AdminRewardItemStatus,
            }))
          }
        >
          {rewardStatusOptions.map((status) => (
            <option key={status} value={status}>
              {rewardItemStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <div className="admin-reward-image-field">
        <label htmlFor={`reward-image-${initialValue.id ?? 'new'}`}>상품 이미지</label>
        <input
          id={`reward-image-${initialValue.id ?? 'new'}`}
          type="file"
          accept={allowedImageTypes.join(',')}
          onChange={(event) => handleImageChange(event.target.files)}
        />
        <div className="admin-reward-image-preview" aria-label="상품 이미지 정사각형 미리보기">
          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="상품 이미지 미리보기" />
          ) : (
            <span>이미지를 선택하면 정사각형으로 미리볼 수 있습니다.</span>
          )}
        </div>
        <small>상품 이미지는 중앙 기준 정사각형으로 저장됩니다. JPG, PNG, WEBP 형식을 지원하며 최대 5MB까지 업로드할 수 있습니다.</small>
        {imageError ? <p className="admin-maintenance-error">{imageError}</p> : null}
      </div>
      <label className="admin-reward-form-wide">
        설명
        <textarea
          value={input.description}
          onChange={(event) =>
            setInput((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="상품 설명을 입력해주세요."
          rows={3}
        />
      </label>
      {validationError ? <p className="admin-maintenance-error">{validationError}</p> : null}
      <div className="admin-reward-form-actions">
        <button className={isSaving ? 'disabled-cta' : 'primary-cta'} type="submit" disabled={isSaving}>
          {isSaving ? '저장 중' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function AdminRewardItemCard({
  item,
  themes,
  isSaving,
  onUpdate,
}: {
  item: AdminRewardItem;
  themes: AdminRewardThemeOption[];
  isSaving: boolean;
  onUpdate: (itemId: string, input: RewardItemFormSubmitInput) => void;
}) {
  return (
    <article className="admin-reward-card">
      <div className="admin-reward-header">
        <div>
          <div className="cart-item-title-row">
            <span className="grade-badge">{item.grade}</span>
            <span className="soft-badge">{rewardItemStatusLabels[item.status]}</span>
            <span className="soft-badge">수정 가능</span>
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
        <div>
          <dt>상품 이미지</dt>
          <dd>{item.imageUrl ? '등록됨' : '-'}</dd>
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

      <details className="admin-reward-edit-panel">
        <summary>상품 정보 수정</summary>
        <RewardItemForm
          key={`${item.id}-${item.updatedAt}`}
          initialValue={createFormInputFromItem(item)}
          themes={themes}
          isSaving={isSaving}
          submitLabel="상품 정보 저장"
          onSubmit={(input) => onUpdate(item.id, input)}
        />
      </details>
    </article>
  );
}

export function AdminItemsPage() {
  const queryClient = useQueryClient();
  const [createFormVersion, setCreateFormVersion] = useState(0);
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
    mutationFn: async (input: RewardItemFormSubmitInput) => {
      const rewardItemId = crypto.randomUUID();
      const imageUrl = input.imageFile
        ? await uploadAdminRewardItemImage(rewardItemId, input.imageFile)
        : input.imageUrl;

      return createAdminRewardItem({
        ...input,
        id: rewardItemId,
        imageUrl,
      });
    },
    onSuccess: () => {
      setCreateFormVersion((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: ['admin-reward-items'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, input }: { itemId: string; input: RewardItemFormSubmitInput }) => {
      const imageUrl = input.imageFile
        ? await uploadAdminRewardItemImage(itemId, input.imageFile)
        : input.imageUrl;

      return updateAdminRewardItem({ id: itemId, ...input, imageUrl });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reward-items'] });
    },
  });

  const themeOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const theme of themes) {
      options.set(theme.id, theme.name);
    }

    return Array.from(options.entries());
  }, [themes]);

  const filteredItems = useMemo(() => filterItems(items, filters), [filters, items]);

  if (isLoading || isThemesLoading) {
    return <section className="state-card">실물 상품을 불러오는 중입니다.</section>;
  }

  if (isError || isThemesError) {
    return (
      <section className="state-card state-card-error">
        <strong>실물 상품을 불러오지 못했습니다.</strong>
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
    <section className="admin-reward-page">
      <div className="page-heading">
        <p className="section-label">관리자 · 실물 상품</p>
        <h1>실물 상품 관리</h1>
        <p>당첨 대상 상품의 기본 정보를 생성하고 수정합니다. 가챠 상품 풀 구성과 재고 생성은 별도 단계에서 처리합니다.</p>
      </div>

      <details className="admin-reward-create-card">
        <summary>실물 상품 추가</summary>
        <RewardItemForm
          key={createFormVersion}
          initialValue={emptyFormInput}
          themes={themes}
          isSaving={createMutation.isPending}
          submitLabel="실물 상품 추가"
          onSubmit={(input) => createMutation.mutate(input)}
        />
        {createMutation.isSuccess ? (
          <p className="admin-maintenance-result">실물 상품을 추가했습니다.</p>
        ) : null}
        {createMutation.isError ? (
          <p className="admin-maintenance-error">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : '실물 상품을 추가하지 못했습니다.'}
          </p>
        ) : null}
      </details>

      {updateMutation.isError ? (
        <section className="state-card state-card-error">
          <strong>실물 상품을 수정하지 못했습니다.</strong>
          <span>
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : '알 수 없는 오류가 발생했습니다.'}
          </span>
        </section>
      ) : null}

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
            <AdminRewardItemCard
              key={item.id}
              item={item}
              themes={themes}
              isSaving={updateMutation.isPending && updateMutation.variables?.itemId === item.id}
              onUpdate={(itemId, input) => updateMutation.mutate({ itemId, input })}
            />
          ))}
        </div>
      )}
    </section>
  );
}
