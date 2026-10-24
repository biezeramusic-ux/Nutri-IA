import { useMemo } from 'react';
import { Flame, Leaf, Star, Trash2 } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { MealPhoto } from './MealPhoto';
import { Text } from './AppText';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { mealEmoji } from '../services/foodCatalog';
import { mealTypeOf } from '../services/dayUtils';
import { mealScoreForGoal } from '../services/healthScore';
import type { Meal } from '../types';

interface Props {
  meal: Meal;
  onPress: () => void;
  onDelete?: () => void;
  /** Estrela de favoritos (o pai decide se é favorita e o que fazer ao tocar). */
  favorite?: boolean;
  onToggleFavorite?: () => void;
}

const time = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Um prato registado: foto, nome, calorias, peso, hora, macros e a nota de 0 a 10 de acordo com a sua meta. */
export function MealEntry({ meal, onPress, onDelete, favorite, onToggleFavorite }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { goals, profile } = useProfile();
  const a = meal.analysis;
  const score = mealScoreForGoal(a, goals, profile?.goal ?? null, mealTypeOf(meal)).score;
  const scoreColor = score >= 7 ? { bg: '#DCFCE7', fg: '#166534', icon: '#16A34A' } : score >= 4 ? { bg: '#FEF3C7', fg: '#92400E', icon: '#D97706' } : { bg: '#FEE2E2', fg: '#991B1B', icon: '#DC2626' };
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]} accessibilityRole="button">
      <MealPhoto uri={meal.photoUri} name={a.food_name} style={styles.photo} emojiSize={34} />
      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={2}>
            {a.food_name}
          </Text>
          <View style={[styles.score, { backgroundColor: scoreColor.bg }]}>
            <Leaf size={11} color={scoreColor.icon} />
            <Text style={[styles.scoreText, { color: scoreColor.fg }]}>{score}</Text>
          </View>
        </View>
        <View style={styles.kcalRow}>
          <Flame size={15} color="#F97316" />
          <Text style={styles.kcal}>{a.calories}</Text>
          <Text style={styles.kcalUnit}>kcal</Text>
          <Text style={styles.sub}>
            {' '}· {a.estimated_weight_grams} g · {time(meal.createdAt)}
          </Text>
        </View>
        <View style={styles.bottom}>
          <View style={styles.macros}>
            <Macro color={colors.protein} label="P" value={a.protein_g} />
            <Macro color={colors.carbs} label="C" value={a.carbs_g} />
            <Macro color={colors.fats} label="G" value={a.fats_g} />
          </View>
          <View style={styles.actions}>
            {onToggleFavorite && (
              <Pressable onPress={onToggleFavorite} hitSlop={10} accessibilityLabel="Favorita">
                <Star size={17} color={favorite ? colors.carbs : colors.textFaint} fill={favorite ? colors.carbs : 'transparent'} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel="Apagar refeição">
                <Trash2 size={16} color={colors.textFaint} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Macro({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${color}22`, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: font.tiny, color, fontWeight: '800' }}>{label}</Text>
      <Text style={{ fontSize: font.tiny, color, fontWeight: '700' }}>{Math.round(value)}g</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 22, backgroundColor: colors.surface },
    photo: { width: 84, height: 84, borderRadius: 18 },
    info: { flex: 1, gap: 5, justifyContent: 'center' },
    top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    name: { flex: 1, fontSize: font.h3, fontWeight: '700', color: colors.text },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    kcal: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    kcalUnit: { fontSize: font.small, fontWeight: '600', color: colors.text },
    sub: { fontSize: font.small, color: colors.textMuted },
    bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    macros: { flexDirection: 'row', gap: 6, flexShrink: 1 },
    score: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
    scoreText: { fontSize: font.small, fontWeight: '800' },
  });
