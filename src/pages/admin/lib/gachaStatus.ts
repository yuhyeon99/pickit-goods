import { getDrawProductDisplayStatus } from '../../gacha/lib/getDrawProductDisplayStatus';
import type { DrawProductStatus } from '../../gacha/model/types';

export const rawGachaStatusLabels: Record<DrawProductStatus, string> = {
  draft: '초안',
  active: '판매중',
  sold_out: '판매 종료',
  hidden: '숨김',
  archived: '보관됨',
};

export function getAdminGachaStatus(status: DrawProductStatus, availableInventoryCount: number) {
  const display = getDrawProductDisplayStatus(status, availableInventoryCount);

  return {
    ...display,
    rawLabel: rawGachaStatusLabels[status],
  };
}
