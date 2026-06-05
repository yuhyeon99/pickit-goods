import { supabase } from '../../../shared/api/supabaseClient';

export type ExpireUnusedDrawCreditsResult = {
  expired_count: number;
  processed_at: string;
};

export async function expireUnusedDrawCredits(): Promise<ExpireUnusedDrawCreditsResult> {
  const { data, error } = await supabase.rpc('expire_unused_draw_credits');

  if (error) {
    throw error;
  }

  return data as ExpireUnusedDrawCreditsResult;
}
