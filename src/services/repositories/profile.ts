import type { DietPreference, QuizAnswers, UserProfile, DailyGoals } from '../../types';
import type { Database } from '../database.types';
import { supabase } from '../supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const DIET_VALUES: DietPreference[] = ['vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'halal', 'no_pork'];

function parseDiet(values: string[]): DietPreference[] {
  return values.filter((v): v is DietPreference => (DIET_VALUES as string[]).includes(v));
}

function rowToProfile(row: ProfileRow): UserProfile {
  const quiz: QuizAnswers | null =
    row.goal &&
    row.sex &&
    row.age !== null &&
    row.height_cm !== null &&
    row.weight_kg !== null &&
    row.activity_level
      ? {
          goal: row.goal,
          sex: row.sex,
          age: row.age,
          heightCm: row.height_cm,
          weightKg: row.weight_kg,
          targetWeightKg: row.target_weight_kg ?? row.weight_kg,
          activity: row.activity_level,
          diet: parseDiet(row.diet_preferences),
        }
      : null;

  const goals: DailyGoals | null =
    row.daily_calorie_goal !== null &&
    row.protein_goal_g !== null &&
    row.carbs_goal_g !== null &&
    row.fats_goal_g !== null &&
    row.water_goal_ml !== null
      ? {
          calories: row.daily_calorie_goal,
          proteinG: row.protein_goal_g,
          carbsG: row.carbs_goal_g,
          fatsG: row.fats_goal_g,
          waterMl: row.water_goal_ml,
        }
      : null;

  return {
    fullName: row.full_name,
    goal: row.goal,
    quiz,
    goals,
    waterReminders: row.water_reminders,
    wakeHour: row.wake_hour,
    sleepHour: row.sleep_hour,
    onboardingCompleted: row.onboarding_completed_at !== null,
  };
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProfile(data) : null;
}

async function updateProfile(userId: string, patch: ProfileUpdate): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(error.message);
}

/** Guarda as respostas do quiz e as metas calculadas, e marca o quiz como concluído. */
export function saveOnboarding(userId: string, answers: QuizAnswers, goals: DailyGoals): Promise<void> {
  return updateProfile(userId, {
    goal: answers.goal,
    sex: answers.sex,
    age: answers.age,
    height_cm: answers.heightCm,
    weight_kg: answers.weightKg,
    target_weight_kg: answers.targetWeightKg,
    activity_level: answers.activity,
    diet_preferences: answers.diet,
    daily_calorie_goal: goals.calories,
    protein_goal_g: goals.proteinG,
    carbs_goal_g: goals.carbsG,
    fats_goal_g: goals.fatsG,
    water_goal_ml: goals.waterMl,
    onboarding_completed_at: new Date().toISOString(),
  });
}

export interface ReminderSettings {
  waterReminders: boolean;
  wakeHour: number;
  sleepHour: number;
}

export function saveReminderSettings(userId: string, s: ReminderSettings): Promise<void> {
  return updateProfile(userId, {
    water_reminders: s.waterReminders,
    wake_hour: s.wakeHour,
    sleep_hour: s.sleepHour,
  });
}

export function saveWaterGoal(userId: string, waterMl: number): Promise<void> {
  return updateProfile(userId, { water_goal_ml: waterMl });
}
