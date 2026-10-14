import { useMemo } from 'react';
import { Flame } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Meal } from '../types';
import { MacroGlyph, type MacroKind } from './MacroGlyph';
import { DishGlyph } from './MealIcon';

const time = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Cartão "comido recentemente": foto à esquerda; nome, hora, calorias e macros com ícones à direita. */
export function RecentMealCard({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const a = meal.analysis;
  const macros: { kind: MacroKind; color: string; value: number }[] = [
    { kind: 'protein', color: colors.protein, value: a.protein_g },
    { kind: 'carbs', color: colors.carbs, value: a.carbs_g },
    { kind: 'fats', color: colors.fats, value: a.fats_g },
  ];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} accessibilityRole="button">
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <DishGlyph size={44} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {a.food_name}
          </Text>
          <Text style={styles.time}>{time(meal.createdAt)}</Text>
        </View>
        <View style={styles.kcalRow}>
          <Flame size={18} color={colors.text} fill={colors.text} />
          <Text style={styles.kcal}>{a.calories} kcal</Text>
        </View>
        <View style={styles.macros}>
          {macros.map((m) => (
            <View key={m.kind} style={styles.macro}>
              <MacroGlyph kind={m.kind} color={m.color} size={15} />
              <Text style={styles.macroText}>{Math.round(m.value)}g</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), flexDirection: 'row', alignItems: 'stretch', borderRadius: radius.lg, overflow: 'hidden' },
    photo: { width: 104, minHeight: 104 },
    placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 6, justifyContent: 'center' },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    name: { flex: 1, fontSize: font.body, fontWeight: '600', color: colors.text },
    time: { fontSize: font.tiny, color: colors.textMuted, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
    kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    kcal: { fontSize: font.h2, fontWeight: '800', color: colors.text },
    macros: { flexDirection: 'row', gap: 14 },
    macro: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    macroText: { fontSize: font.small, color: colors.textMuted, fontWeight: '600' },
  });
