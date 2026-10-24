import { useMemo } from 'react';
import { Flame } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { MealPhoto } from './MealPhoto';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Meal } from '../types';

const time = (ts: number) => `${String(new Date(ts).getHours()).padStart(2, '0')}:${String(new Date(ts).getMinutes()).padStart(2, '0')}`;

/** Cartão do carrossel "Últimos scans": foto grande com as calorias por cima, nome, hora e macros em etiquetas. */
export function ScanCard({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const a = meal.analysis;
  const pill = (label: string, g: number, color: string) => (
    <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.pillText, { color }]}>
        {label} {Math.round(g)}g
      </Text>
    </View>
  );
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View>
        <MealPhoto uri={meal.photoUri} name={a.food_name} style={styles.photo} emojiSize={44} />
        <View style={styles.kcalBadge}>
          <Flame size={13} color="#F97316" />
          <Text style={styles.kcalText}>{a.calories} kcal</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {a.food_name}
      </Text>
      <Text style={styles.time}>{time(meal.createdAt)}</Text>
      <View style={styles.pills}>
        {pill('P', a.protein_g, colors.protein)}
        {pill('C', a.carbs_g, colors.carbs)}
        {pill('G', a.fats_g, colors.fats)}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), width: 176, padding: 8, gap: 6, borderRadius: 24 },
    pressed: { opacity: 0.88 },
    photo: { width: '100%', height: 128, borderRadius: 18 },
    kcalBadge: { position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
    kcalText: { fontSize: font.tiny, fontWeight: '800', color: '#111827' },
    name: { fontSize: font.body, fontWeight: '700', color: colors.text, paddingHorizontal: 4, minHeight: 36 },
    time: { fontSize: font.tiny, color: colors.textMuted, paddingHorizontal: 4, marginTop: -2 },
    pills: { flexDirection: 'row', gap: 4, paddingHorizontal: 2, paddingBottom: 4 },
    pill: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3 },
    pillText: { fontSize: 10, fontWeight: '800' },
  });
