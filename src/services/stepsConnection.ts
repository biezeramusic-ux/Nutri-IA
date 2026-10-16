import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

const KEY = 'nutria.stepsConnected';

export const KCAL_PER_STEP = 0.04;

export async function isStepsConnected(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export type ConnectResult = 'ok' | 'denied' | 'unavailable';

/** Liga o "Nutri Saúde": pede o sensor de movimento (passos) e a localização (rota e km). */
export async function connectSteps(): Promise<ConnectResult> {
  try {
    if (Platform.OS === 'web') return 'unavailable';
    if (!(await Pedometer.isAvailableAsync())) return 'unavailable';
    const motion = await Pedometer.requestPermissionsAsync();
    if (!motion.granted) return 'denied';
    // A localização é opcional: só serve para desenhar a rota das caminhadas.
    await Location.requestForegroundPermissionsAsync().catch(() => undefined);
    await AsyncStorage.setItem(KEY, '1');
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

export async function disconnectSteps(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
}
