import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GoalType } from '../types';

/** Prazo escolhido no quiz para chegar ao peso desejado. Guardado no telemóvel. */
export interface GoalPlan {
  weeks: number;
  startMs: number;
  startWeightKg: number;
}

const key = (userId: string) => `nutria.goalPlan.${userId}`;

export async function loadGoalPlan(userId: string): Promise<GoalPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as GoalPlan) : null;
  } catch {
    return null;
  }
}

export async function saveGoalPlan(userId: string, plan: GoalPlan): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(plan)).catch(() => undefined);
}

export const WEEK_OPTIONS = [4, 8, 12, 16, 24, 36, 52];

/** Ritmo máximo recomendado (kg por semana): perder 0,75; ganhar 0,4. */
export const maxSafeRate = (goal: GoalType): number => (goal === 'lose_weight' ? 0.75 : 0.4);

export const ratePerWeek = (fromKg: number, toKg: number, weeks: number): number => Math.abs(toKg - fromKg) / Math.max(1, weeks);

/** Menor prazo (em semanas) que respeita o ritmo recomendado. */
export function recommendedWeeks(fromKg: number, toKg: number, goal: GoalType): number {
  return WEEK_OPTIONS.find((w) => ratePerWeek(fromKg, toKg, w) <= maxSafeRate(goal)) ?? WEEK_OPTIONS[WEEK_OPTIONS.length - 1];
}
