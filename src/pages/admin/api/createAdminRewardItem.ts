import { supabase } from '../../../shared/api/supabaseClient';
import type { AdminRewardItemFormInput } from '../model/rewardItemTypes';

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createAdminRewardItem(input: AdminRewardItemFormInput) {
  const { data, error } = await supabase
    .from('reward_items')
    .insert({
      ...(input.id ? { id: input.id } : {}),
      name: input.name.trim(),
      description: normalizeText(input.description),
      grade: input.grade,
      theme_id: input.themeId,
      category: input.category.trim(),
      status: input.status,
      image_url: normalizeText(input.imageUrl),
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
