import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';
import { mealIcon } from '../services/foodCatalog';
import type { IconName, Meal } from '../types';

interface Props {
  label: string;
  icon: IconName;
  meals: Meal[];
  onAdd: () => void;
  onOpenMeal: (meal: Meal) => void;
}

/** Linha de uma refeição do dia (pequeno-almoço, almoço…) com + para adicionar. */
export function MealSection({ label, icon, meals, onAdd, onOpenMeal }: Props) {
  const kcal = meals.reduce((s, m) => s + m.analysis.calories, 0);
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.limeDark} />
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
                <MaterialCommunityIcons name={mealIcon(m)} size={16} color={colors.primary} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.add} onPress={onAdd} hitSlop={8} accessibilityLabel={`Adicionar ${label}`}>
        <MaterialCommunityIcons name="plus" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 14, ...shadow },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: '800', color: colors.text },
  kcal: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  thumbs: { flexDirection: 'row' },
  thumbWrap: { marginLeft: -8 },
  thumb: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.card },
  thumbPlaceholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  add: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
