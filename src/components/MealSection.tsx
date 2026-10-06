import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Plus, type LucideIcon } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, font, radius } from '../constants/theme';
import { mealIcon } from '../services/foodCatalog';
import type { Meal } from '../types';

interface Props {
  label: string;
  icon: LucideIcon;
  meals: Meal[];
  onAdd: () => void;
  onOpenMeal: (meal: Meal) => void;
}

/** Linha de uma refeição do dia (pequeno-almoço, almoço…) com + para adicionar. */
export function MealSection({ label, icon: Icon, meals, onAdd, onOpenMeal }: Props) {
  const kcal = meals.reduce((s, m) => s + m.analysis.calories, 0);
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={colors.limeDark} />
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
                <MaterialCommunityIcons name={mealIcon(m)} size={14} color={colors.primary} />
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

const styles = StyleSheet.create({
  card: { ...cardBase, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.lg, padding: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: font.body, fontWeight: '600', color: colors.text },
  kcal: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
  thumbs: { flexDirection: 'row' },
  thumbWrap: { marginLeft: -8 },
  thumb: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.card },
  thumbPlaceholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  add: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
