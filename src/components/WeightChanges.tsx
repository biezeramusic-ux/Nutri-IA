import { ArrowRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { cardBase, font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { todayKey } from '../services/date';
import type { WeightLog } from '../types';
import { tr } from '../i18n';

const WINDOWS: { label: string; days: number | null }[] = [
  { label: '3 dias', days: 3 },
  { label: '7 dias', days: 7 },
  { label: '14 dias', days: 14 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Todo o tempo', days: null },
];

const fmt = (n: number) => Math.abs(n).toFixed(1).replace('.', ',');

/** Variação de peso em vários períodos (para quem quer perder peso). */
export function WeightChanges({ logs }: { logs: WeightLog[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sorted = useMemo(() => [...logs].sort((a, b) => a.day.localeCompare(b.day)), [logs]);
  const latest = sorted[sorted.length - 1];

  const rows = WINDOWS.map((w) => {
    let delta = 0;
    if (latest) {
      let since = '';
      if (w.days !== null) {
        const d = new Date();
        d.setDate(d.getDate() - w.days);
        since = todayKey(d);
      }
      const inWindow = sorted.filter((l) => l.day >= since);
      if (inWindow.length >= 2) delta = latest.weightKg - inWindow[0].weightKg;
    }
    return { ...w, delta: Math.round(delta * 10) / 10 };
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{tr('Alterações de peso')}</Text>
      {rows.map((r) => {
        const color = r.delta === 0 ? colors.textFaint : r.delta < 0 ? colors.primary : colors.danger;
        return (
          <View key={r.label} style={styles.row}>
            <Text style={styles.label}>{tr(r.label)}</Text>
            <View style={[styles.line, { backgroundColor: color }]} />
            <Text style={styles.value}>
              {r.delta > 0 ? '+' : r.delta < 0 ? '−' : ''}
              {fmt(r.delta)} kg
            </Text>
            <ArrowRight size={14} color={color} />
            <Text style={[styles.note, { color }]}>
              {r.delta === 0 ? tr('Sem alteração') : r.delta < 0 ? tr('Perdeu') : tr('Ganhou')}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), padding: 18, gap: 16 },
    title: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    label: { width: 68, fontSize: font.small, color: colors.textMuted },
    line: { width: 28, height: 2, borderRadius: 1 },
    value: { flex: 1, textAlign: 'right', fontSize: font.body, fontWeight: '600', color: colors.text },
    note: { width: 74, fontSize: font.small },
  });
