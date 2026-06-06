import { supabase } from '../../../shared/api/supabaseClient';
import type { AdminRewardItemFormInput } from '../model/rewardItemTypes';

export type UpdateAdminRewardItemInput = AdminRewardItemFormInput & {
  id: string;
};

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateAdminRewardItem(input: UpdateAdminRewardItemInput) {
  const { data, error } = await supabase
    .from('reward_items')
    .update({
      name: input.name.trim(),
      description: normalizeText(input.description),
      grade: input.grade,
      theme_id: input.themeId,
      category: input.category.trim(),
      status: input.status,
      image_url: normalizeText(input.imageUrl),
    })
    .eq('id', input.id)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
