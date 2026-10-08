import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  label: string;
  percent: number;
  grams: number;
  color: string;
  /** Mostra só os gramas (sem percentagem), ex.: no resumo do plano. */
  unitOnly?: boolean;
}

export function MacroSquareCard({ label, percent, grams, color, unitOnly }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <Text style={styles.percent}>{unitOnly ? `${grams} g` : `${percent}%`}</Text>
      <Text style={styles.label}>{label}</Text>
      {!unitOnly && <Text style={styles.grams}>{grams} g</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    ...cardBase(colors),
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bar: { width: 22, height: 4, borderRadius: 2, marginBottom: 6 },
  percent: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  label: { fontSize: font.tiny, color: colors.textMuted, fontWeight: '500' },
  grams: { fontSize: font.tiny, color: colors.textFaint },
});
