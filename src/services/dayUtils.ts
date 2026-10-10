import { Apple, Coffee, Soup, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import type { Meal, MealType } from '../types';
import { todayKey } from './date';

export const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

/** Os 7 dias (segunda a domingo) da semana que contém `ref`. */
export function weekDays(ref: Date): Date[] {
  const offset = (ref.getDay() + 6) % 7; // segunda = 0
  return Array.from({ length: 7 }, (_, i) => new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - offset + i));
}

export const dayKeyOf = (timestamp: number): string => todayKey(new Date(timestamp));

export function getMealType(timestamp: number): MealType {
  const hour = new Date(timestamp).getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'snack';
  return 'dinner';
}

export const MEAL_TYPES: { type: MealType; label: string; icon: LucideIcon; emoji: string }[] = [
  { type: 'breakfast', label: 'Pequeno-almoço', icon: Coffee, emoji: '🥐' },
  { type: 'lunch', label: 'Almoço', icon: UtensilsCrossed, emoji: '🍲' },
  { type: 'snack', label: 'Lanche', icon: Apple, emoji: '🍎' },
  { type: 'dinner', label: 'Jantar', icon: Soup, emoji: '🌙' },
];

export interface Totals {
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export function sumMeals(meals: Meal[]): Totals {
  return meals.reduce<Totals>(
    (t, m) => ({
      kcal: t.kcal + m.analysis.calories,
      protein: t.protein + m.analysis.protein_g,
      carbs: t.carbs + m.analysis.carbs_g,
      fats: t.fats + m.analysis.fats_g,
      fiber: t.fiber + (m.analysis.fiber_g ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
  );
}

export function mealsOfDay(meals: Meal[], key: string): Meal[] {
  return meals.filter((m) => dayKeyOf(m.createdAt) === key);
}
