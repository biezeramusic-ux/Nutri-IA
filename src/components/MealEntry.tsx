import { useMemo } from 'react';
import { Leaf, Trash2 } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { mealScore } from '../services/healthScore';
import type { Meal } from '../types';
import { DishGlyph } from './MealIcon';

interface Props {
  meal: Meal;
  onPress: () => void;
  onDelete?: () => void;
}

const time = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Um prato registado: foto da comida, nome, calorias, peso, hora, macros e pontuação. */
export function MealEntry({ meal, onPress, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const a = meal.analysis;
  const score = mealScore(a).score;
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <DishGlyph size={36} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={2}>
            {a.food_name}
          </Text>
          {onDelete && (
            <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel="Apagar refeição">
              <Trash2 size={16} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
        <Text style={styles.sub}>
          <Text style={styles.kcal}>{a.calories} kcal</Text> · {a.estimated_weight_grams} g · {time(meal.createdAt)}
        </Text>
        <View style={styles.bottom}>
          <View style={styles.macros}>
            <Macro color={colors.protein} icon="🍗" value={a.protein_g} />
            <Macro color={colors.fats} icon="🥑" value={a.fats_g} />
            <Macro color={colors.carbs} icon="🍞" value={a.carbs_g} />
          </View>
          <View style={styles.score}>
            <Leaf size={12} color="#16A34A" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** Macro em pastilha colorida com um alimento que o representa (carne, abacate, pão). */
function Macro({ color, icon, value }: { color: string; icon: string; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${color}26`, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 12 }}>{icon}</Text>
      <Text style={{ fontSize: font.tiny, color: colors.text, fontWeight: '700' }}>{Math.round(value)}g</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
    photo: { width: 72, height: 72, borderRadius: radius.md },
    placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 3 },
    top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    name: { flex: 1, fontSize: font.h3, fontWeight: '600', color: colors.text },
    sub: { fontSize: font.small, color: colors.textMuted },
    kcal: { fontWeight: '800', color: colors.text },
    bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    macros: { flexDirection: 'row', gap: 6, flexShrink: 1 },
    score: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
    scoreText: { fontSize: font.small, fontWeight: '800', color: '#166534' },
  });
