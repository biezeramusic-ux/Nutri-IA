import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Totals } from '../services/dayUtils';
import type { DailyGoals } from '../types';
import { ProgressRing } from './ProgressRing';
import { tr } from '../i18n';

interface Props {
  goals: DailyGoals;
  consumed: Totals;
}

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Cartão do dia: anel com as calorias que faltam, macros em barras e atalho para adicionar comida. */
export function CaloriesCard({ goals, consumed }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const over = consumed.kcal > goals.calories;
  const left = Math.max(0, goals.calories - consumed.kcal);
  const macros = [
    { label: 'Proteínas', value: consumed.protein, goal: goals.proteinG, color: colors.protein },
    { label: 'Gorduras', value: consumed.fats, goal: goals.fatsG, color: colors.fats },
    { label: 'Carboidratos', value: consumed.carbs, goal: goals.carbsG, color: colors.carbs },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.ringCol}>
        <ProgressRing size={118} strokeWidth={11} progress={consumed.kcal / Math.max(1, goals.calories)} color={over ? colors.danger : colors.primary}>
          <Text style={styles.small}>{over ? tr('Acima') : tr('Restante')}</Text>
          <Text style={styles.big}>{over ? `+${fmt(consumed.kcal - goals.calories)}` : fmt(left)}</Text>
          <Text style={styles.small}>kcal</Text>
        </ProgressRing>
        <Text style={styles.goal}>
          {tr('Objetivo')}: {fmt(goals.calories)}
        </Text>
      </View>

      <View style={styles.right}>
        {macros.map((m) => (
          <View key={m.label} style={{ gap: 4 }}>
            <View style={styles.macroTop}>
              <Text style={styles.macroName}>{m.label}</Text>
              <Text style={styles.macroValue}>{fmt(m.value)} g</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(3, Math.min(1, m.value / Math.max(1, m.goal)) * 100)}%`, backgroundColor: m.color }]} />
            </View>
          </View>
        ))}
        <Pressable style={styles.add} onPress={() => router.navigate('/scanner')}>
          <Plus size={14} color={colors.background} strokeWidth={3} />
          <Text style={styles.addText}>{tr('Adicionar alimento')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
    ringCol: { alignItems: 'center', gap: 6 },
    small: { fontSize: font.tiny, color: colors.textMuted },
    big: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    goal: { fontSize: font.tiny, color: colors.textMuted },
    right: { flex: 1, gap: 10 },
    macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    macroName: { fontSize: font.small, fontWeight: '600', color: colors.text },
    macroValue: { fontSize: font.small, fontWeight: '700', color: colors.text },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3 },
    add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, borderRadius: radius.pill, backgroundColor: colors.text, marginTop: 2 },
    addText: { fontSize: font.small, fontWeight: '700', color: colors.background },
  });
