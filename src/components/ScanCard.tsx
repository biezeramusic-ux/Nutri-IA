import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';
import { macroPercentages, mealIcon } from '../services/foodCatalog';
import type { Meal } from '../types';
import { MacroDots } from './MacroDots';

/** Cartão vertical do carrossel "Last Scans": foto grande, nome e macros. */
export function ScanCard({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <MaterialCommunityIcons name={mealIcon(meal)} size={42} color={colors.primary} />
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

const styles = StyleSheet.create({
  card: { width: 172, backgroundColor: colors.card, borderRadius: radius.card, padding: 14, alignItems: 'center', gap: 4, ...shadow },
  pressed: { opacity: 0.88 },
  photo: { width: 112, height: 112, borderRadius: 56, marginBottom: 8 },
  placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '800', color: colors.text, textAlign: 'center', minHeight: 36 },
  kcal: { fontSize: 12, color: colors.textMuted },
});
