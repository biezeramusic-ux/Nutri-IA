import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { macroPercentages, mealEmoji } from '../services/foodCatalog';
import type { Meal } from '../types';
import { MacroDots } from './MacroDots';

/** Cartão vertical do carrossel "Últimos scans": foto, nome e macros. */
export function ScanCard({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <Text style={{ fontSize: 32 }}>{mealEmoji(meal.analysis.food_name)}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={2}>
        {meal.analysis.food_name}
      </Text>
      <Text style={styles.kcal}>{meal.analysis.calories} kcal</Text>
      <MacroDots macros={macroPercentages(meal.analysis)} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: { ...cardBase(colors), width: 144, padding: 12, alignItems: 'center', gap: 2 },
  pressed: { opacity: 0.88 },
  photo: { width: 84, height: 84, borderRadius: 42, marginBottom: 8 },
  placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: font.body, fontWeight: '600', color: colors.text, textAlign: 'center', minHeight: 36 },
  kcal: { fontSize: font.small, color: colors.textMuted },
});
