import { supabase } from '../../../shared/api/supabaseClient';
import { createSquareImageBlob, type SquareImageCrop } from '../lib/createSquareImageBlob';

const DRAW_PRODUCT_IMAGE_BUCKET = 'draw-product-images';

export async function uploadAdminDrawProductImage(
  drawProductId: string,
  file: File,
  crop: SquareImageCrop,
) {
  const imageBlob = await createSquareImageBlob(file, crop);
  const path = `draw-products/${drawProductId}/${Date.now()}.webp`;

  const { error } = await supabase.storage
    .from(DRAW_PRODUCT_IMAGE_BUCKET)
    .upload(path, imageBlob, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (error) {
    throw new Error(`이미지 업로드에 실패했습니다. ${error.message}`);
  }

  const { data } = supabase.storage.from(DRAW_PRODUCT_IMAGE_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}
