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
