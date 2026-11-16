/** Lado do quadrado guardado: chega para 2× o maior avatar mostrado (ver editorial.css). */
export const AVATAR_SIZE = 256;

/** O limite da Api é 512 KB; acima disto a imagem já reduzida é rejeitada antes de enviar. */
export const AVATAR_MAX_BYTES = 512 * 1024;

export interface Crop {
  x: number;
  y: number;
  size: number;
}

/** O maior quadrado ao centro de uma imagem de largura × altura. */
export function centerSquare(width: number, height: number): Crop {
  const size = Math.min(width, height);
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size };
}

/**
 * Corta ao quadrado e reduz para AVATAR_SIZE em JPEG, no browser: a Api não
 * redimensiona. createImageBitmap já aplica a orientação EXIF das fotos do telemóvel.
 */
export async function prepareAvatar(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const crop = centerSquare(bitmap.width, bitmap.height);
    const side = Math.min(AVATAR_SIZE, crop.size);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Sem canvas 2D.");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, crop.x, crop.y, crop.size, crop.size, 0, 0, side, side);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) throw new Error("Não foi possível converter a imagem.");
    return blob;
  } finally {
    bitmap.close();
  }
}
