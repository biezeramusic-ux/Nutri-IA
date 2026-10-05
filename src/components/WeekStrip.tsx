import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../constants/theme';
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
  const today = todayKey();
  return (
    <View style={styles.row}>
      {days.map((day, i) => {
        const key = todayKey(day);
        const selected = key === selectedKey;
        return (
          <Pressable key={key} onPress={() => onSelect(day)} style={[styles.item, selected && styles.selected]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {key === today ? 'Hoje' : WEEKDAY_LABELS[i]}
            </Text>
            <ProgressRing
              size={30}
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 6, borderRadius: radius.md },
  selected: { backgroundColor: colors.lime },
  label: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  labelSelected: { color: colors.text, fontWeight: '800' },
  number: { fontSize: 11, fontWeight: '700', color: colors.text },
});
