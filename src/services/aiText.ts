import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLang } from '../i18n';
import { supabase } from './supabase';

const today = () => new Date().toISOString().slice(0, 10);

/** Resumo de progresso escrito pela IA (só PRO). Devolve null se não houver IA/rede. */
export async function fetchProgressInsight(stats: Record<string, unknown>): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai', { body: { action: 'insight', stats, lang: getLang() } });
    if (error || !data || typeof data.text !== 'string' || !data.text.trim()) return null;
    return data.text.trim();
  } catch {
    return null;
  }
}

/** Frases para os lembretes de água, geradas pela IA no máximo uma vez por dia (por objetivo e idioma). */
export async function getWaterMessages(goal: string | null): Promise<string[] | null> {
  const lang = getLang();
  const key = `nutria.waterMsgs.${lang}.${goal ?? 'generic'}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as { day: string; items: string[] };
      if (parsed.day === today() && parsed.items.length > 0) return parsed.items;
    }
    const { data, error } = await supabase.functions.invoke('ai', { body: { action: 'water', goal: goal ?? 'generic', lang } });
    if (error || !data) return null;
    const raw = String(data.text ?? '').replace(/```json|```/g, '').trim();
    const items = (JSON.parse(raw) as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 160).slice(0, 8);
    if (items.length === 0) return null;
    await AsyncStorage.setItem(key, JSON.stringify({ day: today(), items }));
    return items;
  } catch {
    return null;
  }
}
