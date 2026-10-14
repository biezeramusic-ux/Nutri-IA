import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Meal, MealType } from '../types';
import { MealBadge } from './MealBadge';
import { MealEntry } from './MealEntry';

interface Props {
  label: string;
  type: MealType;
  meals: Meal[];
  onOpenMeal: (meal: Meal) => void;
  isFavorite?: (meal: Meal) => boolean;
  onToggleFavorite?: (meal: Meal) => void;
}

/** Cartão de uma refeição do dia (pequeno-almoço, almoço…): ícone colorido, calorias e os pratos registados. */
export function MealSection({ label, type, meals, onOpenMeal, isFavorite, onToggleFavorite }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const kcal = meals.reduce((s, m) => s + m.analysis.calories, 0);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <MealBadge type={type} />
        <View style={styles.info}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.kcal}>{meals.length === 0 ? 'Nada registado' : `${kcal} kcal`}</Text>
        </View>
      </View>
      {meals.map((m) => (
        <MealEntry
          key={m.id}
          meal={m}
          onPress={() => onOpenMeal(m)}
          favorite={isFavorite?.(m)}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(m) : undefined}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), gap: 12, borderRadius: radius.lg, padding: 12 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    info: { flex: 1 },
    label: { fontSize: font.body, fontWeight: '700', color: colors.text },
    kcal: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
  });
