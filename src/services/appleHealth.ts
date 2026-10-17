import { Platform } from 'react-native';

/**
 * Ligação ao Apple Saúde (HealthKit, iPhone). Só existe na app instalada (build iOS):
 * no Expo Go o módulo nativo não está lá, por isso falha em silêncio e a app usa o sensor do iPhone.
 */
type HK = typeof import('@kingstinct/react-native-healthkit');

function load(): HK | null {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@kingstinct/react-native-healthkit') as HK;
  } catch {
    return null;
  }
}

export type AppleHealthState = 'ok' | 'denied' | 'unavailable';

export async function connectAppleHealth(): Promise<AppleHealthState> {
  const hk = load();
  if (!hk) return 'unavailable';
  try {
    if (!(await hk.isHealthDataAvailableAsync())) return 'unavailable';
    // O iOS não diz se a pessoa negou a leitura; só confirmamos que o pedido foi mostrado.
    const ok = await hk.requestAuthorization({
      toRead: ['HKQuantityTypeIdentifierStepCount', 'HKQuantityTypeIdentifierDistanceWalkingRunning'],
    });
    return ok ? 'ok' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** Passos de hoje lidos do Apple Saúde (somados de todas as fontes: iPhone, Apple Watch, outras apps). */
export async function readAppleHealthSteps(): Promise<number | null> {
  const hk = load();
  if (!hk) return null;
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const res = await hk.queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], {
      filter: { date: { startDate: start, endDate: new Date() } },
      unit: 'count',
    });
    return Math.round(res.sumQuantity?.quantity ?? 0);
  } catch {
    return null;
  }
}
