import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { Text } from '../components/AppText';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { todayKey } from '../services/date';
import { WEEKDAY_LABELS } from '../services/dayUtils';
import { ProgressRing } from './ProgressRing';

interface Props {
  days: Date[];
  selectedKey: string;
  onSelect: (day: Date) => void;
  /** Progresso (0 a 1) de calorias por dia (chave AAAA-MM-DD). */
  progressByDay: Record<string, number>;
}

/** Faixa da semana com um anel de progresso por dia. */
export function WeekStrip({ days, selectedKey, onSelect, progressByDay }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      {days.map((day, i) => {
        const key = todayKey(day);
        const selected = key === selectedKey;
        return (
          <Pressable key={key} onPress={() => onSelect(day)} style={[styles.item, selected && styles.selected]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{WEEKDAY_LABELS[i]}</Text>
            <ProgressRing
              size={28}
              strokeWidth={3}
              progress={progressByDay[key] ?? 0}
              color={colors.primary}
              trackColor={selected ? '#fff' : colors.border}
            >
              <Text style={styles.number}>{day.getDate()}</Text>
            </ProgressRing>
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
  selected: { backgroundColor: colors.lime },
  label: { fontSize: font.tiny, fontWeight: '500', color: colors.textMuted },
  labelSelected: { color: colors.text, fontWeight: '700' },
  number: { fontSize: font.tiny, fontWeight: '600', color: colors.text },
});
