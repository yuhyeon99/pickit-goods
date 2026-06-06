import { supabase } from '../../../shared/api/supabaseClient';
import type { AdminRewardThemeOption } from '../model/rewardItemTypes';

type ThemeRow = {
  id: string;
  name: string;
  status: AdminRewardThemeOption['status'];
};

export async function getAdminRewardThemes(): Promise<AdminRewardThemeOption[]> {
  const { data, error } = await supabase
    .from('themes')
    .select('id, name, status')
    .order('created_at', { ascending: false })
    .returns<ThemeRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((theme) => ({
    id: theme.id,
    name: theme.name,
    status: theme.status,
  }));
}
