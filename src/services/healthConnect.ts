import { Platform } from 'react-native';

/**
 * Ligação ao Google Health Connect (Android). Só existe na app instalada (APK/dev build):
 * no Expo Go o módulo nativo não está lá, por isso tudo falha em silêncio e a app usa o sensor do telemóvel.
 */
type HC = typeof import('react-native-health-connect');

function load(): HC | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-health-connect') as HC;
  } catch {
    return null;
  }
}

export type HealthConnectState = 'ok' | 'denied' | 'not_installed' | 'unavailable';

export async function connectHealthConnect(): Promise<HealthConnectState> {
  const hc = load();
  if (!hc) return 'unavailable';
  try {
    const status = await hc.getSdkStatus();
    if (status === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE) return 'unavailable';
    if (status === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'not_installed';
    if (!(await hc.initialize())) return 'unavailable';
    const granted = await hc.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
    ]);
    return granted.some((p) => p.recordType === 'Steps') ? 'ok' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** Passos de hoje lidos do Health Connect (já sem duplicados entre apps). */
export async function readHealthConnectSteps(): Promise<number | null> {
  const hc = load();
  if (!hc) return null;
  try {
    await hc.initialize();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const res = await hc.aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: new Date().toISOString() },
    });
    return typeof res.COUNT_TOTAL === 'number' ? res.COUNT_TOTAL : 0;
  } catch {
    return null;
  }
}

export function openHealthConnectInStore(): void {
  const hc = load();
  try {
    hc?.openHealthConnectSettings();
  } catch {
    // ignora
  }
}
