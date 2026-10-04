import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';
import { macroPercentages, mealIcon } from '../services/foodCatalog';
import type { Meal } from '../types';
import { MacroDots } from './MacroDots';

interface Props {
  meal: Meal;
  onPress: () => void;
}

export function MealCard({ meal, onPress }: Props) {
  const { analysis } = meal;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <MaterialCommunityIcons name={mealIcon(meal)} size={30} color={colors.primary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {analysis.food_name}
        </Text>
        <Text style={styles.sub}>
          {analysis.estimated_weight_grams} g · {analysis.calories} kcal
        </Text>
        <MacroDots macros={macroPercentages(analysis)} />
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 14,
    gap: 14,
    ...shadow,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  photo: { width: 68, height: 68, borderRadius: 34 },
  placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
