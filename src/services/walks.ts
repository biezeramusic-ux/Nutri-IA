import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RoutePoint {
  lat: number;
  lng: number;
  t: number;
}

export interface Walk {
  id: string;
  start: number;
  end: number;
  distanceM: number;
  steps: number;
  kcal: number;
  points: RoutePoint[];
}

const key = (userId: string) => `nutria.walks.${userId}`;
const MAX_WALKS = 60;
const MAX_POINTS = 300;

export async function loadWalks(userId: string): Promise<Walk[]> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as Walk[]) : [];
  } catch {
    return [];
  }
}

export async function saveWalk(userId: string, walk: Walk): Promise<Walk[]> {
  const list = [walk, ...(await loadWalks(userId))].slice(0, MAX_WALKS);
  await AsyncStorage.setItem(key(userId), JSON.stringify(list)).catch(() => undefined);
  return list;
}

export async function deleteWalk(userId: string, id: string): Promise<Walk[]> {
  const list = (await loadWalks(userId)).filter((w) => w.id !== id);
  await AsyncStorage.setItem(key(userId), JSON.stringify(list)).catch(() => undefined);
  return list;
}

/** Distância entre dois pontos (metros), fórmula de Haversine. */
export function distanceBetween(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Reduz o número de pontos guardados (mantém o início e o fim). */
export function thinPoints(points: RoutePoint[]): RoutePoint[] {
  if (points.length <= MAX_POINTS) return points;
  const step = points.length / MAX_POINTS;
  const out: RoutePoint[] = [];
  for (let i = 0; i < MAX_POINTS; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}

/** Passos estimados a partir da distância e da altura (passo ≈ 41,5% da altura). */
export const stepsFromDistance = (distanceM: number, heightCm = 165): number => Math.round(distanceM / ((heightCm / 100) * 0.415));

export const formatKm = (m: number): string => (m / 1000).toFixed(2).replace('.', ',');

export function formatPace(distanceM: number, ms: number): string {
  if (distanceM < 50) return '--';
  const minPerKm = ms / 60000 / (distanceM / 1000);
  const mm = Math.floor(minPerKm);
  const ss = Math.round((minPerKm - mm) * 60);
  return `${mm}:${String(ss === 60 ? 59 : ss).padStart(2, '0')}`;
}
