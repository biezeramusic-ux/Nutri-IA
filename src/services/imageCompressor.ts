import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

export const MAX_IMAGE_BYTES = 300 * 1024;

export interface CompressedImage {
  uri: string;
  base64: string;
  bytes: number;
}

/** Tamanho aproximado em bytes de uma string base64. */
function base64Bytes(b64: string): number {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

// Tentativas progressivas: largura (px) e qualidade JPEG, da melhor para a mais agressiva.
const ATTEMPTS: { width: number; quality: number }[] = [
  { width: 640, quality: 0.6 },
  { width: 512, quality: 0.5 },
  { width: 448, quality: 0.4 },
  { width: 384, quality: 0.3 },
  { width: 320, quality: 0.2 },
  { width: 256, quality: 0.15 },
];

/**
 * Reduz drasticamente resolução e qualidade da foto para < 300 KB,
 * poupando os megas de internet do utilizador.
 */
export async function compressImage(uri: string): Promise<CompressedImage> {
  let last: CompressedImage | null = null;
  for (const { width, quality } of ATTEMPTS) {
    const result = await manipulateAsync(uri, [{ resize: { width } }], {
      compress: quality,
      format: SaveFormat.JPEG,
      base64: true,
    });
    const base64 = result.base64 ?? '';
    last = { uri: result.uri, base64, bytes: base64Bytes(base64) };
    if (last.bytes < MAX_IMAGE_BYTES) return last;
  }
  // Última tentativa já é muito pequena; devolve o melhor esforço.
  return last as CompressedImage;
}
