import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../components/AppText';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { todayKey } from '../services/date';
import { WEEKDAY_LABELS } from '../services/dayUtils';

interface Props {
  days: Date[];
  selectedKey: string;
  onSelect: (day: Date) => void;
  /** Progresso (0 a 1) de calorias por dia (chave AAAA-MM-DD). */
  progressByDay: Record<string, number>;
}

const SEGMENTS = 12;
const GAP_DEG = 12;

/** Anel feito de traços: cada traço fica verde à medida que o dia avança. */
function DashRing({ size, progress, on, off, width }: { size: number; progress: number; on: string; off: string; width: number }) {
  const r = (size - width) / 2;
  const c = size / 2;
  const filled = Math.round(Math.min(1, Math.max(0, progress)) * SEGMENTS);
  const sweep = 360 / SEGMENTS - GAP_DEG;
  const paths = Array.from({ length: SEGMENTS }, (_, i) => {
    const a0 = ((i * 360) / SEGMENTS - 90 + GAP_DEG / 2) * (Math.PI / 180);
    const a1 = a0 + (sweep * Math.PI) / 180;
    const x0 = c + r * Math.cos(a0);
    const y0 = c + r * Math.sin(a0);
    const x1 = c + r * Math.cos(a1);
    const y1 = c + r * Math.sin(a1);
    return <Path key={i} d={`M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`} stroke={i < filled ? on : off} strokeWidth={width} strokeLinecap="butt" fill="none" />;
  });
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {paths}
    </Svg>
  );
}

/** Faixa da semana: um anel de traços por dia (verde conforme as calorias), o dia escolhido numa pílula branca e hoje destacado. */
export function WeekStrip({ days, selectedKey, onSelect, progressByDay }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const today = todayKey();
  return (
    <View style={styles.row}>
      {days.map((day, i) => {
        const key = todayKey(day);
        const selected = key === selectedKey;
        const future = key > today;
        const p = progressByDay[key] ?? 0;
        return (
          <Pressable key={key} onPress={() => onSelect(day)} style={[styles.item, selected && styles.selected, future && { opacity: 0.5 }]} accessibilityRole="button">
            <Text style={[styles.label, selected && styles.labelSelected]}>{WEEKDAY_LABELS[i]}</Text>
            <View style={styles.ring}>
              <DashRing size={36} width={3.4} progress={p} on={p >= 1 ? '#16A34A' : colors.primary} off={colors.textFaint} />
              <View style={[styles.dot, key === today && { backgroundColor: colors.primary }]}>
                <Text style={[styles.number, key === today && { color: '#fff' }]}>{day.getDate()}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    item: { alignItems: 'center', gap: 6, paddingVertical: 8, width: 44, borderRadius: radius.md },
    selected: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    ring: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: font.tiny, fontWeight: '500', color: colors.textMuted },
    labelSelected: { color: colors.text, fontWeight: '800' },
    number: { fontSize: font.tiny, fontWeight: '700', color: colors.text },
  });
