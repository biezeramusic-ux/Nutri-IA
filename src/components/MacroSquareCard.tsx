import { StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, font, radius } from '../constants/theme';

interface Props {
  label: string;
  percent: number;
  grams: number;
  color: string;
  /** Mostra só os gramas (sem percentagem), ex.: no resumo do plano. */
  unitOnly?: boolean;
}

export function MacroSquareCard({ label, percent, grams, color, unitOnly }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <Text style={styles.percent}>{unitOnly ? `${grams} g` : `${percent}%`}</Text>
      <Text style={styles.label}>{label}</Text>
      {!unitOnly && <Text style={styles.grams}>{grams} g</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardBase,
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
