import { supabase } from '../../../shared/api/supabaseClient';
import type { DrawResultStatus } from '../../my/model/types';
import type { RewardGrade } from '../../gacha/model/types';
import type { AdminDrawLog, DrawLogEventType } from '../model/drawLogTypes';

type MaybeArray<T> = T | T[] | null;

type AdminDrawLogRow = {
  id: string;
  draw_result_id: string | null;
  user_id: string;
  draw_product_id: string | null;
  request_id: string;
  event_type: DrawLogEventType;
  random_method: string | null;
  random_seed_hash: string | null;
  inventory_snapshot_hash: string | null;
  selected_inventory_unit_id: string | null;
  available_inventory_count: number | null;
  payload: unknown;
  error_message: string | null;
  created_at: string;
  profiles: MaybeArray<{
    display_name: string | null;
  }>;
  draw_products: MaybeArray<{
    title: string;
  }>;
  draw_results: MaybeArray<{
    status: DrawResultStatus;
    public_verify_code: string;
    grade: RewardGrade;
    reward_items: MaybeArray<{
      name: string;
      themes: MaybeArray<{
        name: string;
      }>;
    }>;
  }>;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getAdminDrawLogs(): Promise<AdminDrawLog[]> {
  const { data, error } = await supabase
    .from('draw_logs')
    .select(
      `
        id,
        draw_result_id,
        user_id,
        draw_product_id,
        request_id,
        event_type,
        random_method,
        random_seed_hash,
        inventory_snapshot_hash,
        selected_inventory_unit_id,
        available_inventory_count,
        payload,
        error_message,
        created_at,
        profiles(display_name),
        draw_products(title),
        draw_results(
          status,
          public_verify_code,
          grade,
          reward_items(
            name,
            themes(name)
          )
        )
      `,
    )
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<AdminDrawLogRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((log) => {
    const result = firstRelation(log.draw_results);
    const rewardItem = firstRelation(result?.reward_items ?? null);

    return {
      id: log.id,
      drawResultId: log.draw_result_id,
      userId: log.user_id,
      userDisplayName: firstRelation(log.profiles)?.display_name ?? null,
      drawProductId: log.draw_product_id,
      drawProductTitle: firstRelation(log.draw_products)?.title ?? null,
      requestId: log.request_id,
      eventType: log.event_type,
      randomMethod: log.random_method,
      randomSeedHash: log.random_seed_hash,
      inventorySnapshotHash: log.inventory_snapshot_hash,
      selectedInventoryUnitId: log.selected_inventory_unit_id,
      availableInventoryCount: log.available_inventory_count,
      payload: log.payload,
      errorMessage: log.error_message,
      createdAt: log.created_at,
      resultStatus: result?.status ?? null,
      publicVerifyCode: result?.public_verify_code ?? null,
      rewardName: rewardItem?.name ?? null,
      themeName: firstRelation(rewardItem?.themes ?? null)?.name ?? null,
      grade: result?.grade ?? null,
    };
  });
}
