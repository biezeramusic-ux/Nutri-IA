import { getLang } from '../i18n';
import { todayKey } from './date';

export type StatsPeriod = 'week' | 'month' | 'year';

export interface Bucket {
  key: string;
  label: string;
  /** Dias (YYYY-MM-DD) que fazem parte da barra. */
  days: string[];
}

export interface StatsRange {
  buckets: Bucket[];
  title: string;
  fromKey: string;
  toKey: string;
  /** Mostrar 1 etiqueta em cada N barras. */
  labelEvery: number;
}

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => {
  try {
    return d.toLocaleDateString(getLang(), o);
  } catch {
    return d.toLocaleDateString(undefined, o);
  }
};

/** Intervalo mostrado (semana, mês ou ano) deslocado `offset` períodos para trás/frente. */
export function buildRange(period: StatsPeriod, offset: number, ref = new Date()): StatsRange {
  if (period === 'week') {
    const dow = (ref.getDay() + 6) % 7;
    const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - dow + offset * 7);
    const days = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    return {
      buckets: days.map((d) => ({ key: todayKey(d), label: fmt(d, { day: '2-digit', month: '2-digit' }).replace('/', '.'), days: [todayKey(d)] })),
      title: `${fmt(days[0], { day: 'numeric', month: 'short' })} — ${fmt(days[6], { day: 'numeric', month: 'short', year: 'numeric' })}`,
      fromKey: todayKey(days[0]),
      toKey: todayKey(days[6]),
      labelEvery: 1,
    };
  }
  if (period === 'month') {
    const first = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
    const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: count }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1));
    return {
      buckets: days.map((d) => ({ key: todayKey(d), label: String(d.getDate()), days: [todayKey(d)] })),
      title: fmt(first, { month: 'long', year: 'numeric' }),
      fromKey: todayKey(days[0]),
      toKey: todayKey(days[count - 1]),
      labelEvery: 5,
    };
  }
  const year = ref.getFullYear() + offset;
  const buckets: Bucket[] = Array.from({ length: 12 }, (_, m) => {
    const count = new Date(year, m + 1, 0).getDate();
    return {
      key: `${year}-${m + 1}`,
      label: fmt(new Date(year, m, 1), { month: 'short' }).replace('.', ''),
      days: Array.from({ length: count }, (_, i) => todayKey(new Date(year, m, i + 1))),
    };
  });
  return { buckets, title: String(year), fromKey: `${year}-01-01`, toKey: `${year}-12-31`, labelEvery: 1 };
}
