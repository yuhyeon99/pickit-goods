const SQUARE_IMAGE_SIZE = 800;

export type SquareImageCrop = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export const defaultSquareImageCrop: SquareImageCrop = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지를 불러오지 못했습니다.'));
    };

    image.src = objectUrl;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function drawSquareImageToCanvas(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  crop: SquareImageCrop = defaultSquareImageCrop,
  size = SQUARE_IMAGE_SIZE,
) {
  const zoom = clamp(crop.zoom, 1, 3);
  const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const scale = baseScale * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const maxOffsetX = Math.max(0, (width - size) / 2);
  const maxOffsetY = Math.max(0, (height - size) / 2);
  const offsetX = (clamp(crop.offsetX, -100, 100) / 100) * maxOffsetX;
  const offsetY = (clamp(crop.offsetY, -100, 100) / 100) * maxOffsetY;
  const x = (size - width) / 2 + offsetX;
  const y = (size - height) / 2 + offsetY;

  context.clearRect(0, 0, size, size);
  context.drawImage(image, x, y, width, height);
}

export async function createSquareImageBlob(
  file: File,
  crop: SquareImageCrop = defaultSquareImageCrop,
) {
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('이미지 변환을 준비하지 못했습니다.');
  }

  canvas.width = SQUARE_IMAGE_SIZE;
  canvas.height = SQUARE_IMAGE_SIZE;
  drawSquareImageToCanvas(context, image, crop);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('이미지 변환에 실패했습니다.'));
          return;
        }

        resolve(blob);
      },
      'image/webp',
      0.9,
    );
  });
}
