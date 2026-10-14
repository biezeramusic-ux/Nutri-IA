import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from '../services/date';

/** Fotografia do dia que o widget do ecrã inicial mostra. Escrita pela app, lida pelo widget. */
export interface WidgetSnapshot {
  /** Dia a que os consumos pertencem (AAAA-MM-DD). */
  day: string;
  goalKcal: number;
  goalProteinG: number;
  goalCarbsG: number;
  goalFatsG: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export const WIDGET_NAME = 'NutritionWidget';
const KEY = 'nutria.widget.v1';

export async function saveWidgetSnapshot(s: WidgetSnapshot): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

/** Lê o último estado. Se for de outro dia, os consumos voltam a zero (dia novo, nada registado ainda). */
export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as WidgetSnapshot;
    return s.day === todayKey() ? s : { ...s, day: todayKey(), kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 };
  } catch {
    return null;
  }
}
