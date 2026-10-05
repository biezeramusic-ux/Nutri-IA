import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

/** Limite para enviar à IA (poupa os megas do utilizador). */
export const MAX_IMAGE_BYTES = 300 * 1024;
/** Limite para arquivar no Supabase (~0,05 MB por foto). */
export const STORAGE_IMAGE_BYTES = 50 * 1024;

export interface CompressedImage {
  uri: string;
  base64: string;
  bytes: number;
}

interface Attempt {
  width: number;
  quality: number;
}

// Tentativas progressivas: largura (px) e qualidade JPEG, da melhor para a mais agressiva.
const AI_ATTEMPTS: Attempt[] = [
  { width: 640, quality: 0.6 },
  { width: 512, quality: 0.5 },
  { width: 448, quality: 0.4 },
  { width: 384, quality: 0.3 },
  { width: 320, quality: 0.2 },
  { width: 256, quality: 0.15 },
];

const STORAGE_ATTEMPTS: Attempt[] = [
  { width: 480, quality: 0.5 },
  { width: 420, quality: 0.4 },
  { width: 360, quality: 0.35 },
  { width: 320, quality: 0.3 },
  { width: 280, quality: 0.25 },
  { width: 240, quality: 0.2 },
  { width: 200, quality: 0.15 },
];

/** Tamanho aproximado em bytes de uma string base64. */
function base64Bytes(b64: string): number {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

async function compressUntil(uri: string, maxBytes: number, attempts: Attempt[]): Promise<CompressedImage> {
  let last: CompressedImage | null = null;
  for (const { width, quality } of attempts) {
    const result = await manipulateAsync(uri, [{ resize: { width } }], {
      compress: quality,
      format: SaveFormat.JPEG,
      base64: true,
    });
    const base64 = result.base64 ?? '';
    last = { uri: result.uri, base64, bytes: base64Bytes(base64) };
    if (last.bytes < maxBytes) return last;
  }
  // A última tentativa já é a mais agressiva; devolve o melhor esforço.
  return last as CompressedImage;
}

/** Reduz resolução e qualidade para < 300 KB antes de enviar à IA. */
export function compressImage(uri: string): Promise<CompressedImage> {
  return compressUntil(uri, MAX_IMAGE_BYTES, AI_ATTEMPTS);
}

/** Reduz a foto para ~50 KB antes de a arquivar no Supabase. */
export function compressForStorage(uri: string): Promise<CompressedImage> {
  return compressUntil(uri, STORAGE_IMAGE_BYTES, STORAGE_ATTEMPTS);
}
