import { useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { macroPercentages, mealIcon } from '../services/foodCatalog';
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
          <MaterialCommunityIcons name={mealIcon(meal)} size={32} color={colors.primary} />
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
