import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuizAnswers } from '../types';

/** Respostas extra do quiz (para a IA conhecer melhor a pessoa). */
export interface CoachExtras {
  challenges: string[];
  mealsPerDay: number;
  cookingTime: 'low' | 'normal' | 'high';
  motivations: string[];
  supportStyle: string;
  weeks?: number;
  experience?: string;
  energy?: string;
  trainDays?: number;
  hasCoach?: boolean;
  dietStyle?: string;
}

const key = (userId: string) => `nutria.coachContext.${userId}`;
let context = '';

export const getCoachContext = (): string => context;
export const setCoachContext = (text: string): void => {
  context = text.slice(0, 700);
};

/** Resume tudo o que a app sabe da pessoa numa linha (inglês, curta) para dar à IA e personalizar as respostas. */
export function buildCoachContext(a: QuizAnswers, extra: CoachExtras, firstName?: string): string {
  const parts = [
    firstName ? `name=${firstName}` : '',
    `goal=${a.goal}`,
    `sex=${a.sex}`,
    `age=${a.age}`,
    `height_cm=${a.heightCm}`,
    `weight_kg=${a.weightKg}`,
    a.targetWeightKg !== a.weightKg ? `target_weight_kg=${a.targetWeightKg}` : '',
    extra.weeks ? `timeframe_weeks=${extra.weeks}` : '',
    `activity=${a.activity}`,
    a.conditions.length ? `conditions=${a.conditions.join('|')}` : '',
    a.diet.length ? `diet=${a.diet.join('|')}` : '',
    a.staples.length ? `staple_foods=${a.staples.join('|')}` : '',
    extra.challenges.length ? `challenges=${extra.challenges.join('|')}` : '',
    `meals_per_day=${extra.mealsPerDay}`,
    `cooking_time=${extra.cookingTime}`,
    extra.motivations.length ? `motivation=${extra.motivations.join('|')}` : '',
    extra.experience ? `calorie_app_experience=${extra.experience}` : '',
    extra.energy ? `daily_energy=${extra.energy}` : '',
    extra.trainDays !== undefined ? `workouts_per_week=${extra.trainDays}` : '',
    extra.hasCoach !== undefined ? `has_trainer_or_nutritionist=${extra.hasCoach}` : '',
    extra.dietStyle ? `diet_style=${extra.dietStyle}` : '',
    extra.supportStyle ? `support_style=${extra.supportStyle}` : '',
    a.habits.skipsMeals ? 'skips_meals' : '',
    a.habits.eatsOut ? 'eats_out_often' : '',
    a.habits.sugaryDrinks ? 'sugary_drinks' : '',
    !a.habits.eatsFruitVeg ? 'low_fruit_veg' : '',
    !a.habits.drinksEnoughWater ? 'low_water' : '',
  ];
  return parts.filter(Boolean).join('; ');
}

export async function saveCoachContext(userId: string, text: string): Promise<void> {
  setCoachContext(text);
  await AsyncStorage.setItem(key(userId), text).catch(() => undefined);
}

export async function loadCoachContext(userId: string): Promise<void> {
  try {
    const t = await AsyncStorage.getItem(key(userId));
    if (t) setCoachContext(t);
  } catch {
    // ignora
  }
}
