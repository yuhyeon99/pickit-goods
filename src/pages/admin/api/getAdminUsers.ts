import { supabase } from '../../../shared/api/supabaseClient';
import type { DrawResultStatus } from '../../my/model/types';
import type { OrderStatus } from '../model/orderTypes';
import type {
  AdminUser,
  AdminUserCreditSummary,
  AdminUserRecentDrawResult,
  AdminUserRecentOrder,
  CreditStatus,
} from '../model/userTypes';
import type { RewardGrade } from '../../gacha/model/types';
import type { UserRole } from '../../../shared/model/auth/types';

type MaybeArray<T> = T | T[] | null;

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
};

type CreditRow = {
  user_id: string;
  status: CreditStatus;
};

type DrawResultRow = {
  id: string;
  user_id: string;
  grade: RewardGrade;
  status: DrawResultStatus;
  created_at: string;
  reward_items: MaybeArray<{
    name: string;
  }>;
  draw_products: MaybeArray<{
    title: string;
  }>;
};

type ClaimRequestRow = {
  id: string;
  user_id: string;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function createEmptyCreditSummary(): AdminUserCreditSummary {
  return {
    total: 0,
    unused: 0,
    used: 0,
    expired: 0,
    refunded: 0,
    failed: 0,
  };
}

function pushLimited<T>(map: Map<string, T[]>, key: string, value: T, limit: number) {
  const current = map.get(key) ?? [];

  if (current.length < limit) {
    current.push(value);
    map.set(key, current);
  }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, role, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<ProfileRow[]>();

  if (error) {
    throw error;
  }

  const userIds = (profiles ?? []).map((profile) => profile.id);

  if (userIds.length === 0) {
    return [];
  }

  const [
    { data: orders, error: ordersError },
    { data: credits, error: creditsError },
    { data: drawResults, error: drawResultsError },
    { data: claimRequests, error: claimRequestsError },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, user_id, status, total_amount, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .returns<OrderRow[]>(),
    supabase
      .from('user_draw_credits')
      .select('user_id, status')
      .in('user_id', userIds)
      .returns<CreditRow[]>(),
    supabase
      .from('draw_results')
      .select(
        `
          id,
          user_id,
          grade,
          status,
          created_at,
          reward_items(name),
          draw_products(title)
        `,
      )
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .returns<DrawResultRow[]>(),
    supabase
      .from('claim_requests')
      .select('id, user_id')
      .in('user_id', userIds)
      .returns<ClaimRequestRow[]>(),
  ]);

  if (ordersError) throw ordersError;
  if (creditsError) throw creditsError;
  if (drawResultsError) throw drawResultsError;
  if (claimRequestsError) throw claimRequestsError;

  const orderCountByUser = new Map<string, number>();
  const recentOrdersByUser = new Map<string, AdminUserRecentOrder[]>();
  const creditSummaryByUser = new Map<string, AdminUserCreditSummary>();
  const drawResultCountByUser = new Map<string, number>();
  const recentDrawResultsByUser = new Map<string, AdminUserRecentDrawResult[]>();
  const claimRequestCountByUser = new Map<string, number>();

  for (const order of orders ?? []) {
    orderCountByUser.set(order.user_id, (orderCountByUser.get(order.user_id) ?? 0) + 1);
    pushLimited(
      recentOrdersByUser,
      order.user_id,
      {
        id: order.id,
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
      },
      3,
    );
  }

  for (const credit of credits ?? []) {
    const summary = creditSummaryByUser.get(credit.user_id) ?? createEmptyCreditSummary();
    summary.total += 1;
    summary[credit.status] += 1;
    creditSummaryByUser.set(credit.user_id, summary);
  }

  for (const result of drawResults ?? []) {
    drawResultCountByUser.set(result.user_id, (drawResultCountByUser.get(result.user_id) ?? 0) + 1);
    pushLimited(
      recentDrawResultsByUser,
      result.user_id,
      {
        id: result.id,
        rewardName: firstRelation(result.reward_items)?.name ?? '알 수 없는 상품',
        drawProductTitle: firstRelation(result.draw_products)?.title ?? '알 수 없는 가챠',
        grade: result.grade,
        status: result.status,
        createdAt: result.created_at,
      },
      3,
    );
  }

  for (const claim of claimRequests ?? []) {
    claimRequestCountByUser.set(
      claim.user_id,
      (claimRequestCountByUser.get(claim.user_id) ?? 0) + 1,
    );
  }

  return (profiles ?? []).map((profile) => {
    const creditSummary = creditSummaryByUser.get(profile.id) ?? createEmptyCreditSummary();

    return {
      id: profile.id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      orderCount: orderCountByUser.get(profile.id) ?? 0,
      unusedCreditCount: creditSummary.unused,
      usedCreditCount: creditSummary.used,
      drawResultCount: drawResultCountByUser.get(profile.id) ?? 0,
      claimRequestCount: claimRequestCountByUser.get(profile.id) ?? 0,
      creditSummary,
      recentOrders: recentOrdersByUser.get(profile.id) ?? [],
      recentDrawResults: recentDrawResultsByUser.get(profile.id) ?? [],
    };
  });
}
