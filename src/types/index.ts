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
  /** Fibras (g). Recurso PRO. */
  fiber_g?: number;
  /** Estimativas extra da IA (recurso PRO), todas por porção. */
  sugar_g?: number;
  added_sugar_g?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  polyunsaturated_fat_g?: number;
  monounsaturated_fat_g?: number;
  cholesterol_mg?: number;
  sodium_mg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  potassium_mg?: number;
  vitamin_a_iu?: number;
  vitamin_c_mg?: number;
  vitamin_d_iu?: number;
  /** Análise de saúde escrita pela IA (2 a 4 frases). */
  health_analysis?: string;
}

/** Campos numéricos extra de FoodAnalysis (escalam com a porção). */
export const EXTRA_NUMBER_KEYS = [
  'sugar_g',
  'added_sugar_g',
  'saturated_fat_g',
  'trans_fat_g',
  'polyunsaturated_fat_g',
  'monounsaturated_fat_g',
  'cholesterol_mg',
  'sodium_mg',
  'calcium_mg',
  'iron_mg',
  'potassium_mg',
  'vitamin_a_iu',
  'vitamin_c_mg',
  'vitamin_d_iu',
] as const;
export type ExtraNumberKey = (typeof EXTRA_NUMBER_KEYS)[number];

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
  /** Refeição escolhida no scanner (senão deduz-se pela hora). Guardada no telemóvel. */
  mealType?: MealType;
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
  /** Registos de refeição que ainda pode fazer durante o teste; null para PRO (ilimitado). */
  mealsLeft: number | null;
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

export interface WeightLog {
  day: string;
  weightKg: number;
}

export interface ActivityLog {
  id: string;
  day: string;
  type: string;
  minutes: number;
  kcal: number;
}
