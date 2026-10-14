import { useMemo } from 'react';
import { DishGlyph } from './MealIcon';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Meal, MealType } from '../types';
import { MealEntry } from './MealEntry';
import { MealIcon } from './MealIcon';

interface Props {
  label: string;
  type: MealType;
  meals: Meal[];
  onAdd: () => void;
  onOpenMeal: (meal: Meal) => void;
}

/** Linha de uma refeição do dia (pequeno-almoço, almoço…) com + para adicionar. */
export function MealSection({ label, type, meals, onAdd, onOpenMeal }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const kcal = meals.reduce((s, m) => s + m.analysis.calories, 0);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <MealIcon type={type} />
        <View style={styles.info}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.kcal}>{meals.length === 0 ? 'Nada registado' : `${kcal} kcal`}</Text>
        </View>
        <Pressable style={styles.add} onPress={onAdd} hitSlop={8} accessibilityLabel={`Adicionar ${label}`}>
          <Plus size={18} color={colors.text} />
        </Pressable>
      </View>
      {meals.map((m) => (
        <MealEntry key={m.id} meal={m} onPress={() => onOpenMeal(m)} />
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: { ...cardBase(colors), gap: 12, borderRadius: radius.lg, padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1 },
  label: { fontSize: font.body, fontWeight: '600', color: colors.text },
  kcal: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
  add: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
