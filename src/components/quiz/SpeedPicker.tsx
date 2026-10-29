import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';
import { DragSlider } from './DragSlider';

interface Props {
  /** Diferença entre o peso atual e o desejado (kg, positivo). */
  diffKg: number;
  weeks: number;
  recommendedWeeks: number;
  safeRate: number;
  width: number;
  onWeeks: (weeks: number) => void;
}

/** Velocidade para chegar à meta: arraste da tartaruga (devagar) à chita (rápido). Mostra kg por semana e a data de chegada. */
export function SpeedPicker({ diffKg, weeks, recommendedWeeks, safeRate, width, onWeeks }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const maxRate = Math.max(0.2, safeRate * 1.5);
  const rate = Math.min(maxRate, Math.max(0.05, diffKg / Math.max(1, weeks)));
  const pos = Math.round(((rate - 0.05) / (maxRate - 0.05)) * 100);
  const setPos = (p: number) => {
    const r = 0.05 + (p / 100) * (maxRate - 0.05);
    onWeeks(Math.max(2, Math.min(104, Math.round(diffKg / r))));
  };
  const level = rate > safeRate ? 2 : weeks <= recommendedWeeks ? 1 : 0;
  const date = new Date(Date.now() + weeks * 7 * 86400000).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const animals = ['🐢', '🐇', '🐆'];
  return (
    <View style={styles.panel}>
      <Text style={styles.label}>{tr('Ritmo para a sua meta')}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={styles.big}>{rate.toFixed(2).replace('.', ',')}</Text>
        <Text style={styles.unit}>{tr('kg por semana')}</Text>
      </View>
      <View style={styles.animals}>
        {animals.map((a, i) => (
          <View key={a} style={[styles.animal, level === i && styles.animalOn]}>
            <Text style={{ fontSize: level === i ? 34 : 26, opacity: level === i ? 1 : 0.4 }}>{a}</Text>
          </View>
        ))}
      </View>
      <DragSlider value={pos} min={0} max={100} length={width - 64} onChange={setPos} />
      <View style={styles.legend}>
        <Text style={styles.legendText}>{tr('Devagar')}</Text>
        <Text style={styles.legendText}>{tr('Rápido')}</Text>
      </View>
      <View style={[styles.verdict, level === 2 && { backgroundColor: colors.dangerSoft }]}>
        <Text style={[styles.verdictText, level === 2 && { color: colors.danger }]}>
          {level === 2 ? tr('Ritmo muito rápido') : level === 1 ? tr('Recomendado') : tr('Ritmo suave, fácil de manter')}
        </Text>
      </View>
      <Text style={styles.note}>{tr('Chegaria por volta de {date}.', { date })}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12, alignItems: 'center' },
    label: { fontSize: font.small, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
    big: { fontSize: 50, lineHeight: 56, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    unit: { fontSize: font.h3, color: colors.textMuted, fontWeight: '600' },
    animals: { flexDirection: 'row', gap: 22, alignItems: 'flex-end', height: 52 },
    animal: { alignItems: 'center', justifyContent: 'center' },
    animalOn: {},
    legend: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 14, marginTop: -6 },
    legendText: { fontSize: font.small, color: colors.textMuted },
    verdict: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
    verdictText: { fontSize: font.small, fontWeight: '800', color: colors.primaryDark },
    note: { fontSize: font.small, color: colors.textMuted, textAlign: 'center' },
  });
