import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Minutos extra da hora de acordar e de dormir (0 a 59). As horas inteiras continuam na conta;
 * os minutos ficam neste telemóvel e juntam-se às horas para marcar os lembretes (ex.: 7h + 30 min = 07:30).
 */
export interface ScheduleExtra {
  wake: number;
  sleep: number;
}

let extra: ScheduleExtra = { wake: 0, sleep: 0 };
let loadedFor: string | null = null;
const subs = new Set<() => void>();
const key = (uid: string) => `nutria.scheduleMin.${uid}`;

async function load(uid: string): Promise<void> {
  loadedFor = uid;
  try {
    const raw = await AsyncStorage.getItem(key(uid));
    const parsed = raw ? (JSON.parse(raw) as Partial<ScheduleExtra>) : {};
    extra = { wake: Number(parsed.wake) || 0, sleep: Number(parsed.sleep) || 0 };
  } catch {
    extra = { wake: 0, sleep: 0 };
  }
  subs.forEach((f) => f());
}

export function useScheduleExtra() {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    if (uid && loadedFor !== uid) void load(uid);
    return () => {
      subs.delete(f);
    };
  }, [uid]);

  const setExtra = (next: ScheduleExtra) => {
    extra = next;
    subs.forEach((f) => f());
    if (uid) void AsyncStorage.setItem(key(uid), JSON.stringify(next)).catch(() => undefined);
  };
  return { extra, setExtra };
}
