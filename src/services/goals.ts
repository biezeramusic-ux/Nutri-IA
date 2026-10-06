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
  // Na gravidez ou amamentação não aplicamos défice calórico.
  const pregnant = a.conditions.includes('pregnancy');
  const adjustment = pregnant ? Math.max(0, CALORIE_ADJUSTMENT[a.goal]) : CALORIE_ADJUSTMENT[a.goal];
  const calories = clamp(roundTo(tdee + adjustment, 10), floor, 5000);

  const proteinG = Math.round(PROTEIN_PER_KG[a.goal] * a.weightKg);
  const fatsG = Math.round(0.8 * a.weightKg);
  const carbsKcal = calories - proteinG * 4 - fatsG * 9;
  const carbsG = Math.max(50, Math.round(carbsKcal / 4));

  return { calories, proteinG, carbsG, fatsG, waterMl: calculateWaterMl(a.weightKg, a.activity) };
}

export const glassesFromMl = (ml: number): number => Math.max(4, Math.round(ml / GLASS_ML));

/** Dicas personalizadas (máx. 3) com base nas respostas do quiz. */
export function planTips(a: QuizAnswers): string[] {
  const tips: string[] = [];
  if (a.conditions.includes('pregnancy')) {
    tips.push('Na gravidez ou amamentação não aplicamos défice calórico. Fale com o seu médico sobre a sua alimentação.');
  } else if (a.conditions.length > 0) {
    tips.push('O Nutri IA não substitui o seu médico. Confirme estas metas com um profissional de saúde.');
  }
  if (a.habits.sugaryDrinks) tips.push('Trocar refrigerantes e sumos açucarados por água pode poupar muitas calorias por dia.');
  if (a.habits.skipsMeals) tips.push('Saltar refeições costuma aumentar a fome à noite. Vamos ajudá-lo a distribuir as calorias.');
  if (a.habits.eatsOut) tips.push('Quando comer fora, faça o scan do prato para ver as calorias antes de comer.');
  if (!a.habits.eatsFruitVeg) tips.push('Tente juntar fruta ou legumes a uma refeição por dia.');
  if (!a.habits.drinksEnoughWater) tips.push('Vai receber lembretes para chegar à sua meta de água.');
  return tips.slice(0, 3);
}
