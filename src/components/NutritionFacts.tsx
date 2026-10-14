import { useMemo } from 'react';
import { HeartPulse } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import type { FoodAnalysis } from '../types';

interface Row {
  label: string;
  value: number | undefined;
  unit: string;
  sub?: boolean;
}

const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** "Análise de saúde" (texto da IA) e tabela "Informações nutricionais", só com os valores que existem. */
export function NutritionFacts({ analysis }: { analysis: FoodAnalysis }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const a = analysis;
  const netCarbs = a.fiber_g !== undefined ? Math.max(0, a.carbs_g - a.fiber_g) : undefined;
  const rows: Row[] = [
    { label: 'Carboidratos totais', value: a.carbs_g, unit: 'g' },
    { label: 'Fibra alimentar', value: a.fiber_g, unit: 'g', sub: true },
    { label: 'Açúcar', value: a.sugar_g, unit: 'g', sub: true },
    { label: 'Açúcares adicionados', value: a.added_sugar_g, unit: 'g', sub: true },
    { label: 'Carboidratos líquidos', value: netCarbs, unit: 'g', sub: true },
    { label: 'Proteína', value: a.protein_g, unit: 'g' },
    { label: 'Gordura total', value: a.fats_g, unit: 'g' },
    { label: 'Gordura saturada', value: a.saturated_fat_g, unit: 'g', sub: true },
    { label: 'Gordura trans', value: a.trans_fat_g, unit: 'g', sub: true },
    { label: 'Gordura poli-insaturada', value: a.polyunsaturated_fat_g, unit: 'g', sub: true },
    { label: 'Gordura monoinsaturada', value: a.monounsaturated_fat_g, unit: 'g', sub: true },
    { label: 'Colesterol', value: a.cholesterol_mg, unit: 'mg' },
    { label: 'Sódio', value: a.sodium_mg, unit: 'mg' },
    { label: 'Cálcio', value: a.calcium_mg, unit: 'mg' },
    { label: 'Ferro', value: a.iron_mg, unit: 'mg' },
    { label: 'Potássio', value: a.potassium_mg, unit: 'mg' },
    { label: 'Vitamina A', value: a.vitamin_a_iu, unit: 'IU' },
    { label: 'Vitamina C', value: a.vitamin_c_mg, unit: 'mg' },
    { label: 'Vitamina D', value: a.vitamin_d_iu, unit: 'IU' },
  ].filter((r) => r.value !== undefined);

  return (
    <>
      {!!a.health_analysis && (
        <View style={styles.card}>
          <View style={styles.head}>
            <HeartPulse size={16} color={colors.primary} />
            <Text style={styles.title}>{tr('Análise de saúde')}</Text>
          </View>
          <Text style={styles.analysis}>{a.health_analysis}</Text>
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.title}>{tr('Informações nutricionais')}</Text>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.row, i > 0 && styles.rowLine]}>
            <Text style={[styles.label, r.sub && styles.sub]}>{tr(r.label)}</Text>
            <Text style={styles.value}>
              {fmt(r.value as number)}
              {r.unit}
            </Text>
          </View>
        ))}
        {rows.length <= 3 && <Text style={styles.hint}>{tr('Valores estimados pela IA a partir da foto.')}</Text>}
      </View>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), borderRadius: radius.lg, padding: 16, gap: 4 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    title: { fontSize: font.small, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
    analysis: { fontSize: font.body, lineHeight: 22, color: colors.text },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11 },
    rowLine: { borderTopWidth: 1, borderTopColor: colors.border },
    label: { fontSize: font.body, color: colors.text, flexShrink: 1 },
    sub: { color: colors.textMuted, paddingLeft: 14 },
    value: { fontSize: font.body, fontWeight: '600', color: colors.text },
    hint: { fontSize: font.tiny, color: colors.textFaint, marginTop: 6 },
  });
