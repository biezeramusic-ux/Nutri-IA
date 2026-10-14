import { useMemo } from 'react';
import { Plus } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { mealEmoji } from '../services/foodCatalog';
import type { Meal } from '../types';

interface Props {
  label: string;
  emoji: string;
  meals: Meal[];
  onAdd: () => void;
  onOpenMeal: (meal: Meal) => void;
}

/** Linha de uma refeição do dia (pequeno-almoço, almoço…) com + para adicionar. */
export function MealSection({ label, emoji, meals, onAdd, onOpenMeal }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const kcal = meals.reduce((s, m) => s + m.analysis.calories, 0);
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
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
                <Text style={{ fontSize: 14 }}>{mealEmoji(m.analysis.food_name)}</Text>
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
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: font.body, fontWeight: '600', color: colors.text },
  kcal: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
  thumbs: { flexDirection: 'row' },
  thumbWrap: { marginLeft: -8 },
  thumb: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.card },
  thumbPlaceholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 18 },
  add: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
