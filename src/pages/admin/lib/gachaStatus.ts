import { getDrawProductDisplayStatus } from '../../gacha/lib/getDrawProductDisplayStatus';
import type { DrawProductStatus } from '../../gacha/model/types';

export const rawGachaStatusLabels: Record<DrawProductStatus, string> = {
  draft: 'draft',
  active: 'active',
  sold_out: 'sold_out',
  hidden: 'hidden',
  archived: 'archived',
};

export function getAdminGachaStatus(status: DrawProductStatus, availableInventoryCount: number) {
  const display = getDrawProductDisplayStatus(status, availableInventoryCount);

  return {
    ...display,
    rawLabel: rawGachaStatusLabels[status],
  };
}
