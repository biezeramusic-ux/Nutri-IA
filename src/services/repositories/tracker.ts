import type { ActivityLog, WeightLog } from '../../types';
import { supabase } from '../supabase';

export async function getWater(userId: string, day: string): Promise<number> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('glasses')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.glasses ?? 0;
}

export async function setWater(userId: string, day: string, glasses: number): Promise<void> {
  const { error } = await supabase
    .from('water_logs')
    .upsert({ user_id: userId, day, glasses }, { onConflict: 'user_id,day' });
  if (error) throw new Error(error.message);
}

export async function listWeights(userId: string, sinceDay: string): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('day, weight_kg')
    .eq('user_id', userId)
    .gte('day', sinceDay)
    .order('day', { ascending: true });
  if (error) throw new Error(error.message);
  return data.map((r) => ({ day: r.day, weightKg: r.weight_kg }));
}

export async function saveWeight(userId: string, day: string, weightKg: number): Promise<void> {
  const { error } = await supabase
    .from('weight_logs')
    .upsert({ user_id: userId, day, weight_kg: weightKg }, { onConflict: 'user_id,day' });
  if (error) throw new Error(error.message);
}

export async function listActivities(userId: string, day: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, day, type, minutes, kcal')
    .eq('user_id', userId)
    .eq('day', day)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function addActivity(
  userId: string,
  entry: { day: string; type: string; minutes: number; kcal: number },
): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({ user_id: userId, ...entry })
    .select('id, day, type, minutes, kcal')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('activity_logs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getSteps(userId: string, day: string): Promise<number> {
  const { data, error } = await supabase
    .from('daily_steps')
    .select('steps')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.steps ?? 0;
}

export async function saveSteps(userId: string, day: string, steps: number): Promise<void> {
  const { error } = await supabase
    .from('daily_steps')
    .upsert({ user_id: userId, day, steps }, { onConflict: 'user_id,day' });
  if (error) throw new Error(error.message);
}
