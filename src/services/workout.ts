import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLang } from '../i18n';
import { getCoachContext } from './coachProfile';
import { supabase } from './supabase';

export type Place = 'home' | 'gym' | 'outdoor' | 'studio';
export type Level = 'beginner' | 'medium' | 'advanced';
export type WorkoutKind = 'strength' | 'hiit' | 'pilates' | 'mobility' | 'stretch';

export interface TrainingPrefs {
  place: Place;
  level: Level;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  tip?: string;
}

export interface WorkoutPlan {
  id: string;
  kind: WorkoutKind;
  place: Place;
  title: string;
  minutes: number;
  kcal: number;
  warmup: string[];
  exercises: Exercise[];
  cooldown: string[];
  note?: string;
  createdAt: number;
  /** true quando foi escrito pela IA; false é um treino base da app. */
  ai: boolean;
}

export const PLACES: { id: Place; label: string }[] = [
  { id: 'home', label: 'Em casa' },
  { id: 'gym', label: 'No ginásio' },
  { id: 'outdoor', label: 'Ao ar livre' },
  { id: 'studio', label: 'Em aulas ou estúdio' },
];
export const LEVELS: { id: Level; label: string; sub: string }[] = [
  { id: 'beginner', label: 'Iniciante', sub: 'Estou a começar ou a voltar' },
  { id: 'medium', label: 'Intermédio', sub: 'Treino com alguma regularidade' },
  { id: 'advanced', label: 'Avançado', sub: 'Treino forte há bastante tempo' },
];

const prefsKey = (uid: string) => `nutria.trainingPrefs.${uid}`;
const savedKey = (uid: string) => `nutria.workoutsSaved.${uid}`;

export async function loadPrefs(uid: string): Promise<TrainingPrefs | null> {
  try {
    const raw = await AsyncStorage.getItem(prefsKey(uid));
    return raw ? (JSON.parse(raw) as TrainingPrefs) : null;
  } catch {
    return null;
  }
}
export const savePrefs = (uid: string, prefs: TrainingPrefs) => AsyncStorage.setItem(prefsKey(uid), JSON.stringify(prefs)).catch(() => undefined);

export async function loadSaved(uid: string): Promise<WorkoutPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(savedKey(uid));
    return raw ? (JSON.parse(raw) as WorkoutPlan[]) : [];
  } catch {
    return [];
  }
}
export async function toggleSaved(uid: string, plan: WorkoutPlan): Promise<WorkoutPlan[]> {
  const list = await loadSaved(uid);
  const next = list.some((w) => w.id === plan.id) ? list.filter((w) => w.id !== plan.id) : [plan, ...list].slice(0, 30);
  await AsyncStorage.setItem(savedKey(uid), JSON.stringify(next)).catch(() => undefined);
  return next;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Dica de treino do dia, escrita pela IA (no máximo uma por dia, por objetivo, local e idioma). */
export async function getTrainingTip(goal: string | null, prefs: TrainingPrefs, stats: Record<string, unknown>, force = false): Promise<string | null> {
  const lang = getLang();
  const key = `nutria.trainingTip.${lang}.${goal ?? 'g'}.${prefs.place}`;
  try {
    if (!force) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const p = JSON.parse(cached) as { day: string; text: string };
        if (p.day === todayKey() && p.text) return p.text;
      }
    }
    const { data, error } = await supabase.functions.invoke('ai', { body: { action: 'workout_tip', goal: goal ?? 'generic', place: prefs.place, level: prefs.level, stats, lang, context: getCoachContext() } });
    if (error || !data || typeof data.text !== 'string' || !data.text.trim()) return null;
    const text = data.text.trim();
    await AsyncStorage.setItem(key, JSON.stringify({ day: todayKey(), text })).catch(() => undefined);
    return text;
  } catch {
    return null;
  }
}

/** Dica básica quando a IA não está disponível. */
export function fallbackTip(goal: string | null): string {
  if (goal === 'lose_weight') return 'Corra ou caminhe 2 a 3 km hoje: ajuda a queimar calorias e a perder peso.';
  if (goal === 'gain_muscle') return 'Hoje treine força com foco nas pernas e nas costas e coma proteína em todas as refeições.';
  return 'Mexa-se 30 minutos hoje: uma caminhada rápida já ajuda a manter a energia e o peso.';
}

// --- Treinos base (sem IA) -------------------------------------------------------------

const ex = (name: string, sets: number, reps: string, restSec: number, tip?: string): Exercise => ({ name, sets, reps, restSec, tip });

const BASE: Record<WorkoutKind, { title: string; warmup: string[]; cooldown: string[]; kcalPerMin: number; home: Exercise[]; gym?: Exercise[] }> = {
  strength: {
    title: 'Treino de força',
    warmup: ['Rotação de ombros e braços 1 min', 'Agachamentos sem peso 1 min', 'Marcha no lugar 2 min'],
    cooldown: ['Alongar pernas e costas 3 min', 'Respirar fundo 1 min'],
    kcalPerMin: 6,
    home: [ex('Agachamento', 3, '12-15', 60, 'Costas retas e joelhos alinhados'), ex('Flexões (joelhos se precisar)', 3, '8-12', 60), ex('Afundos alternados', 3, '10 por perna', 60), ex('Ponte de glúteos', 3, '15', 45), ex('Remada com mochila', 3, '12', 60, 'Puxe os cotovelos para trás'), ex('Prancha', 3, '30-45 s', 45)],
    gym: [ex('Agachamento com barra ou máquina', 4, '8-10', 90), ex('Supino', 3, '8-10', 90), ex('Remada sentado', 3, '10-12', 75), ex('Leg press', 3, '12', 75), ex('Desenvolvimento de ombros', 3, '10', 75), ex('Prancha', 3, '45 s', 45)],
  },
  hiit: {
    title: 'Cardio intenso (HIIT)',
    warmup: ['Marcha no lugar 2 min', 'Rotação de braços e ancas 1 min'],
    cooldown: ['Caminhar devagar 2 min', 'Alongar pernas 2 min'],
    kcalPerMin: 9,
    home: [ex('Polichinelos', 4, '40 s', 20), ex('Agachamento com salto', 4, '30 s', 30), ex('Corrida no lugar com joelhos altos', 4, '40 s', 20), ex('Alpinista (mountain climbers)', 4, '30 s', 30), ex('Prancha', 3, '30 s', 30)],
  },
  pilates: {
    title: 'Pilates',
    warmup: ['Respiração profunda 1 min', 'Círculos de ancas 1 min'],
    cooldown: ['Postura da criança 1 min', 'Alongamento da coluna 2 min'],
    kcalPerMin: 3.5,
    home: [ex('The Hundred', 3, '30 s', 20), ex('Ponte com elevação de pernas', 3, '12', 30), ex('Prancha lateral', 3, '20 s por lado', 30), ex('Roll-up', 3, '8', 30), ex('Dead bug', 3, '10 por lado', 30), ex('Nadador', 3, '20 s', 20)],
  },
  mobility: {
    title: 'Mobilidade',
    warmup: ['Rotação do pescoço e ombros 1 min'],
    cooldown: ['Respirar fundo 1 min'],
    kcalPerMin: 2.5,
    home: [ex('Gato e vaca', 2, '10', 15), ex('Rotação da coluna deitado', 2, '10 por lado', 15), ex('Agachamento profundo parado', 2, '30 s', 15), ex('Alongar flexores da anca', 2, '30 s por lado', 15), ex('Círculos de ombros', 2, '15', 15)],
  },
  stretch: {
    title: 'Alongamento',
    warmup: ['Caminhar no lugar 1 min'],
    cooldown: ['Respirar devagar 1 min'],
    kcalPerMin: 2,
    home: [ex('Alongar posteriores da coxa', 2, '30 s por lado', 10), ex('Alongar quadríceps', 2, '30 s por lado', 10), ex('Alongar peito na parede', 2, '30 s', 10), ex('Alongar costas (postura da criança)', 2, '40 s', 10), ex('Alongar gémeos', 2, '30 s por lado', 10)],
  },
};

export function basePlan(kind: WorkoutKind, place: Place, minutes: number): WorkoutPlan {
  const b = BASE[kind];
  const list = place === 'gym' && b.gym ? b.gym : b.home;
  return {
    id: `${Date.now()}`,
    kind,
    place,
    title: b.title,
    minutes,
    kcal: Math.round(b.kcalPerMin * minutes),
    warmup: b.warmup,
    exercises: list,
    cooldown: b.cooldown,
    note: 'Treino base. Com o plano Pro, o treino é pensado para si.',
    createdAt: Date.now(),
    ai: false,
  };
}

/** Pede um treino à IA (só Pro). Sem IA ou sem plano devolve um treino base e diz porquê. */
export async function generateWorkout(kind: WorkoutKind, prefs: TrainingPrefs, minutes: number, goal: string | null): Promise<{ plan: WorkoutPlan; proOnly: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke('ai', { body: { action: 'workout_plan', kind, place: prefs.place, level: prefs.level, minutes, goal: goal ?? 'generic', lang: getLang(), context: getCoachContext() } });
    if (data?.error === 'pro_only') return { plan: basePlan(kind, prefs.place, minutes), proOnly: true };
    if (error || !data) throw new Error('ai_unavailable');
    const raw = JSON.parse(String(data.text ?? '').replace(/```json|```/g, '').trim()) as Record<string, unknown>;
    const exercises = (Array.isArray(raw.exercises) ? raw.exercises : [])
      .map((e) => e as Record<string, unknown>)
      .filter((e) => typeof e.name === 'string')
      .slice(0, 10)
      .map((e) => ({ name: String(e.name), sets: Number(e.sets) || 3, reps: String(e.reps ?? '10'), restSec: Number(e.rest_sec) || 60, tip: typeof e.tip === 'string' ? e.tip : undefined }));
    if (exercises.length < 3) throw new Error('bad_plan');
    const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 5) : []);
    return {
      proOnly: false,
      plan: {
        id: `${Date.now()}`,
        kind,
        place: prefs.place,
        title: typeof raw.title === 'string' && raw.title ? raw.title : BASE[kind].title,
        minutes: Number(raw.minutes) || minutes,
        kcal: Math.round(Number(raw.kcal) || BASE[kind].kcalPerMin * minutes),
        warmup: list(raw.warmup),
        exercises,
        cooldown: list(raw.cooldown),
        note: typeof raw.note === 'string' ? raw.note : undefined,
        createdAt: Date.now(),
        ai: true,
      },
    };
  } catch {
    return { plan: basePlan(kind, prefs.place, minutes), proOnly: false };
  }
}
