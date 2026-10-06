import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Formato estrito devolvido pelo motor de IA. */
export interface FoodAnalysis {
  food_name: string;
  estimated_weight_grams: number;
  calories: number;
  carbs_g: number;
  protein_g: number;
  fats_g: number;
  /** Certeza da IA na identificação (0 a 100), quando disponível. */
  confidence?: number;
}

export interface Ingredient {
  name: string;
  grams: number;
  icon: IconName;
  /** Proteína aproximada por 100 g deste ingrediente (para mostrar a origem da proteína). */
  p100?: number;
}

export interface MacroPercentages {
  carbs: number;
  protein: number;
  fats: number;
}

export interface Meal {
  id: string;
  createdAt: number;
  analysis: FoodAnalysis;
  ingredients: Ingredient[];
  photoUri?: string;
}

export type PlanId = 'weekly' | 'monthly' | 'yearly';

export interface Plan {
  id: PlanId;
  label: string;
  priceMT: number;
  days: number;
  period: string;
  badge?: string;
}

export type LockReason = 'trial_expired' | 'daily_limit' | null;

/** Estado de acesso calculado no servidor (get_access_status / consume_scan). */
export interface AccessStatus {
  isPremium: boolean;
  trialDaysLeft: number;
  /** null para utilizadores premium (scans ilimitados). */
  scansLeftToday: number | null;
  lockReason: LockReason;
}

export type GoalType = 'lose_weight' | 'maintain' | 'gain_muscle' | 'eat_healthy' | 'track_calories';
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type DietPreference =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'lactose_free'
  | 'halal'
  | 'no_pork'
  | 'peanut_allergy'
  | 'shellfish_allergy';
export type HealthCondition = 'diabetes' | 'hypertension' | 'high_cholesterol' | 'pregnancy';

/** Hábitos (respostas sim/não do quiz). */
export interface Habits {
  skipsMeals: boolean;
  eatsOut: boolean;
  sugaryDrinks: boolean;
  eatsFruitVeg: boolean;
  drinksEnoughWater: boolean;
}

/** Respostas do quiz inicial. */
export interface QuizAnswers {
  goal: GoalType;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activity: ActivityLevel;
  conditions: HealthCondition[];
  habits: Habits;
  diet: DietPreference[];
  /** Alimentos que come com mais frequência (ids em src/services/staples.ts). */
  staples: string[];
}

/** Metas diárias calculadas a partir do quiz. */
export interface DailyGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  waterMl: number;
}

export interface UserProfile {
  fullName: string;
  goal: GoalType | null;
  quiz: QuizAnswers | null;
  goals: DailyGoals | null;
  waterReminders: boolean;
  wakeHour: number;
  sleepHour: number;
  onboardingCompleted: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
