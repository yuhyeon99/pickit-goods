import { getCartItems } from '../../cart/api/getCartItems';
import { getMyClaimRequests } from './getMyClaimRequests';
import { getMyDrawCredits } from './getMyDrawCredits';
import { getMyDrawResults } from './getMyDrawResults';
import type { MySummary } from '../model/types';

export async function getMySummary(userId: string): Promise<MySummary> {
  const [credits, results, claims, cartItems] = await Promise.all([
    getMyDrawCredits(userId),
    getMyDrawResults(userId),
    getMyClaimRequests(userId),
    getCartItems(userId),
  ]);

  const now = Date.now();
  const isUsableCredit = (status: string, expiresAt: string) =>
    status === 'unused' && new Date(expiresAt).getTime() > now;

  return {
    unusedCreditCount: credits.filter((credit) =>
      isUsableCredit(credit.status, credit.expiresAt),
    ).length,
    usedCreditCount: credits.filter((credit) => credit.status === 'used').length,
    drawResultCount: results.length,
    claimRequestCount: claims.length,
    cartItemCount: cartItems.length,
    cartQuantity: cartItems.reduce((total, item) => total + item.quantity, 0),
    recentCreditTitle: credits[0]?.productTitle ?? null,
    recentResultName: results[0]?.rewardName ?? null,
    recentClaimStatus: claims[0]?.status ?? null,
  };
}
