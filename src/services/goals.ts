import type { ActivityLevel, DailyGoals, GoalType, QuizAnswers } from '../types';

export const GLASS_ML = 250;

export const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  proteinG: 100,
  carbsG: 250,
  fatsG: 65,
  waterMl: 2000,
};

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

/** Água extra (ml) por nível de atividade. */
const ACTIVITY_WATER_ML: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 200,
  moderate: 400,
  very_active: 700,
};

const CALORIE_ADJUSTMENT: Record<GoalType, number> = {
  lose_weight: -450,
  maintain: 0,
  gain_muscle: 300,
  eat_healthy: 0,
  track_calories: 0,
};

const PROTEIN_PER_KG: Record<GoalType, number> = {
  lose_weight: 1.8,
  maintain: 1.4,
  gain_muscle: 2.0,
  eat_healthy: 1.4,
  track_calories: 1.4,
};

/** Bónus pelo clima quente de Moçambique. */
const HOT_CLIMATE_FACTOR = 1.1;

const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Gasto energético basal (Mifflin-St Jeor). */
export function basalMetabolicRate(a: Pick<QuizAnswers, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  return 10 * a.weightKg + 6.25 * a.heightCm - 5 * a.age + (a.sex === 'male' ? 5 : -161);
}

export function calculateWaterMl(weightKg: number, activity: ActivityLevel): number {
  const base = 35 * weightKg + ACTIVITY_WATER_ML[activity];
  return clamp(roundTo(base * HOT_CLIMATE_FACTOR, 50), 1500, 4500);
}

export function calculateGoals(a: QuizAnswers): DailyGoals {
  const tdee = basalMetabolicRate(a) * ACTIVITY_FACTOR[a.activity];
  const floor = a.sex === 'male' ? 1500 : 1200;
  const calories = clamp(roundTo(tdee + CALORIE_ADJUSTMENT[a.goal], 10), floor, 5000);

  const proteinG = Math.round(PROTEIN_PER_KG[a.goal] * a.weightKg);
  const fatsG = Math.round(0.8 * a.weightKg);
  const carbsKcal = calories - proteinG * 4 - fatsG * 9;
  const carbsG = Math.max(50, Math.round(carbsKcal / 4));

  return { calories, proteinG, carbsG, fatsG, waterMl: calculateWaterMl(a.weightKg, a.activity) };
}

export const glassesFromMl = (ml: number): number => Math.max(4, Math.round(ml / GLASS_ML));
