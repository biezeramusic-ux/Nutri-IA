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
}

export interface Ingredient {
  name: string;
  grams: number;
  icon: IconName;
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
