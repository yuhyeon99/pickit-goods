import type { DrawProductStatus } from '../model/types';

type DisplayStatus = {
  label: string;
  tone: 'active' | 'limited' | 'soldOut' | 'hidden';
};

export function getDrawProductDisplayStatus(
  status: DrawProductStatus,
  availableInventoryCount: number,
): DisplayStatus {
  if (status === 'active') {
    return { label: '판매중', tone: 'active' };
  }

  if (status === 'sold_out' && availableInventoryCount > 0) {
    return { label: '구매마감 · 보유권 사용 가능', tone: 'limited' };
  }

  if (status === 'sold_out') {
    return { label: '품절', tone: 'soldOut' };
  }

  return { label: '사용자 화면 미노출', tone: 'hidden' };
}
