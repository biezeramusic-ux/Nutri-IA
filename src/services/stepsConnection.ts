import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { connectAppleHealth } from './appleHealth';
import { connectHealthConnect } from './healthConnect';

const KEY = 'nutria.stepsConnected';

export const KCAL_PER_STEP = 0.04;

/** Como os passos são lidos: Google Health Connect (Android), Apple Saúde (iPhone) ou o sensor de movimento do telemóvel. */
export type StepsSource = 'healthconnect' | 'applehealth' | 'sensor';

export async function getStepsSource(): Promise<StepsSource | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'healthconnect' ? 'healthconnect' : v === 'applehealth' ? 'applehealth' : v === '1' || v === 'sensor' ? 'sensor' : null;
  } catch {
    return null;
  }
}

export type ConnectResult =
  | { status: 'ok'; source: StepsSource }
  | { status: 'denied' | 'unavailable' | 'not_installed' | 'location_denied' | 'gps_off' };

/** Liga os passos (Google Health Connect / Apple Saúde ou sensor). O GPS é opcional: serve para o mapa, a rota e os km. */
export async function connectSteps(opts: { gps: boolean } = { gps: true }): Promise<ConnectResult> {
  try {
    if (Platform.OS === 'web') return { status: 'unavailable' };
    // Passos.
    let source: StepsSource | null = null;

    if (Platform.OS === 'android') {
      const hc = await connectHealthConnect();
      if (hc === 'ok') source = 'healthconnect';
      else if (hc === 'denied') return { status: 'denied' };
      else if (hc === 'not_installed') return { status: 'not_installed' };
    }

    if (Platform.OS === 'ios') {
      const ah = await connectAppleHealth();
      if (ah === 'ok') source = 'applehealth';
    }

    if (!source) {
      if (!(await Pedometer.isAvailableAsync())) return { status: 'unavailable' };
      const motion = await Pedometer.requestPermissionsAsync();
      if (!motion.granted) return { status: 'denied' };
      source = 'sensor';
    }

    // GPS opcional: se a pessoa recusar, os passos ficam ligados na mesma (só não há mapa).
    if (opts.gps) await Location.requestForegroundPermissionsAsync().catch(() => undefined);
    await AsyncStorage.setItem(KEY, source);
    return { status: 'ok', source };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function disconnectSteps(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
}
