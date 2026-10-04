import { supabase } from '../supabase';

export interface ActiveFast {
  id: string;
  startedAt: number;
  goalHours: number;
}

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

export async function getActiveFast(userId: string): Promise<ActiveFast | null> {
  const { data, error } = await supabase
    .from('fasting_sessions')
    .select('id, started_at, goal_hours')
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data
    ? { id: data.id, startedAt: new Date(data.started_at).getTime(), goalHours: data.goal_hours }
    : null;
}

export async function startFast(userId: string, goalHours: number): Promise<ActiveFast> {
  const { data, error } = await supabase
    .from('fasting_sessions')
    .insert({ user_id: userId, goal_hours: goalHours })
    .select('id, started_at, goal_hours')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, startedAt: new Date(data.started_at).getTime(), goalHours: data.goal_hours };
}

export async function stopFast(id: string): Promise<void> {
  const { error } = await supabase
    .from('fasting_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
