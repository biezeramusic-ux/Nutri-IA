import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';
import type { Totals } from '../services/dayUtils';
import type { DailyGoals } from '../types';
import { MacroLeftBar } from './MacroLeftBar';
import { ProgressRing } from './ProgressRing';

interface Props {
  goals: DailyGoals;
  consumed: Totals;
}

/** Cartão "Calorias restantes" com anel e barras de macros (estilo NOOT). */
export function CaloriesCard({ goals, consumed }: Props) {
  const left = Math.max(0, goals.calories - consumed.kcal);
  const over = consumed.kcal > goals.calories;
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
        <ProgressRing
          size={92}
          strokeWidth={10}
          progress={consumed.kcal / goals.calories}
          color={over ? colors.danger : colors.primary}
        >
          <View style={styles.flame}>
            <Ionicons name="flame" size={22} color={over ? colors.danger : colors.primary} />
          </View>
        </ProgressRing>
      </View>
      <View style={styles.macros}>
        <MacroLeftBar
          label="Proteína"
          leftG={goals.proteinG - consumed.protein}
          progress={consumed.protein / goals.proteinG}
          color={colors.primary}
        />
        <MacroLeftBar
          label="Carbs"
          leftG={goals.carbsG - consumed.carbs}
          progress={consumed.carbs / goals.carbsG}
          color={colors.carbs}
        />
        <MacroLeftBar
          label="Gordura"
          leftG={goals.fatsG - consumed.fats}
          progress={consumed.fats / goals.fatsG}
          color={colors.protein}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, gap: 18, ...shadow },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  big: { fontSize: 44, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  sub: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  flame: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  macros: { flexDirection: 'row', gap: 14, backgroundColor: colors.background, borderRadius: radius.md, padding: 14 },
});
