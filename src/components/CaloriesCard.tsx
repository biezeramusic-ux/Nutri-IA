import { useMemo } from 'react';
import { Flame } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Totals } from '../services/dayUtils';
import type { DailyGoals } from '../types';
import { MacroLeftBar } from './MacroLeftBar';
import { ProgressRing } from './ProgressRing';
import { tr } from '../i18n';

interface Props {
  goals: DailyGoals;
  consumed: Totals;
  /** Objetivo "só saber as calorias": sem meta diária, mostra apenas o que foi consumido. */
  noGoal?: boolean;
}

/** Cartão "Calorias restantes" com anel e barras de macros. */
export function CaloriesCard({ goals, consumed, noGoal = false }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const left = Math.max(0, goals.calories - consumed.kcal);
  const over = consumed.kcal > goals.calories;
  if (noGoal) {
    return (
      <View style={styles.card}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.big}>{consumed.kcal}</Text>
            <Text style={styles.sub}>{tr('Calorias de hoje')}</Text>
            <Text style={styles.meta}>{tr('Sem meta diária')}</Text>
          </View>
          <View style={styles.plainRing}>
            <Flame size={22} color={colors.primary} />
          </View>
        </View>
        <View style={styles.macros}>
          <MacroLeftBar noGoal label={tr('Proteína')} leftG={consumed.protein} progress={1} color={colors.primary} />
          <MacroLeftBar noGoal label={tr('Carbs')} leftG={consumed.carbs} progress={1} color={colors.carbs} />
          <MacroLeftBar noGoal label={tr('Gordura')} leftG={consumed.fats} progress={1} color={colors.protein} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.big}>{over ? `+${consumed.kcal - goals.calories}` : left}</Text>
          <Text style={styles.sub}>{over ? 'Calorias acima da meta' : 'Calorias restantes'}</Text>
          <Text style={styles.meta}>
            {consumed.kcal} de {goals.calories} kcal
          </Text>
        </View>
        <ProgressRing size={76} strokeWidth={8} progress={consumed.kcal / goals.calories} color={over ? colors.danger : colors.primary}>
          <Flame size={22} color={over ? colors.danger : colors.primary} />
        </ProgressRing>
      </View>
      <View style={styles.macros}>
        <MacroLeftBar label={tr('Proteína')} leftG={goals.proteinG - consumed.protein} progress={consumed.protein / goals.proteinG} color={colors.primary} />
        <MacroLeftBar label={tr('Carbs')} leftG={goals.carbsG - consumed.carbs} progress={consumed.carbs / goals.carbsG} color={colors.carbs} />
        <MacroLeftBar label={tr('Gordura')} leftG={goals.fatsG - consumed.fats} progress={consumed.fats / goals.fatsG} color={colors.protein} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: { ...cardBase(colors), padding: 16, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  big: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.8 },
  sub: { fontSize: font.body, color: colors.textMuted, fontWeight: '500' },
  meta: { fontSize: font.small, color: colors.textFaint, marginTop: 2 },
  plainRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 8, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  macros: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 },
});
