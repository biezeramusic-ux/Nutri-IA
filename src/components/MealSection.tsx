import { useMemo } from 'react';
import { DishGlyph } from './MealIcon';
import { Plus } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Meal, MealType } from '../types';
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
      <MealIcon type={type} />
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.kcal}>{meals.length === 0 ? 'Nada registado' : `${kcal} kcal`}</Text>
      </View>
      <View style={styles.thumbs}>
        {meals.slice(0, 3).map((m) => (
          <Pressable key={m.id} onPress={() => onOpenMeal(m)} style={styles.thumbWrap}>
            {m.photoUri ? (
              <Image source={{ uri: m.photoUri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <DishGlyph size={16} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.add} onPress={onAdd} hitSlop={8} accessibilityLabel={`Adicionar ${label}`}>
        <Plus size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: { ...cardBase(colors), flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.lg, padding: 12 },
  info: { flex: 1 },
  label: { fontSize: font.body, fontWeight: '600', color: colors.text },
  kcal: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
  thumbs: { flexDirection: 'row' },
  thumbWrap: { marginLeft: -8 },
  thumb: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.card },
  thumbPlaceholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  add: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
