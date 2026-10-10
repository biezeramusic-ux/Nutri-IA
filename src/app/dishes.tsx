import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { Text } from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInUp } from '../components/Motion';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchBar } from '../components/SearchBar';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useDiary } from '../hooks/useDiary';
import { useTheme } from '../hooks/useTheme';
import { buildMeal, mealEmoji, mozambicanDishes } from '../services/foodCatalog';
import { tr } from '../i18n';

export default function DishesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setCurrent } = useDiary();
  const [query, setQuery] = useState('');
  const dishes = useMemo(() => mozambicanDishes(), []);
  const shown = dishes.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()));

  const open = (index: number) => {
    const meal = buildMeal(shown[index].analysis);
    setCurrent(meal);
    router.push({ pathname: '/details', params: { id: meal.id } });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={tr('Pratos moçambicanos')} />
        <Text style={styles.sub}>{tr('Valores aproximados por porção típica. Funciona sem internet.')}</Text>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={() => undefined} />
        {shown.map((d, i) => {
          const meal = buildMeal(d.analysis);
          return (
            <FadeInUp key={d.name} delay={Math.min(i * 45, 500)}>
            <Pressable style={styles.row} onPress={() => open(i)}>
              <View style={styles.icon}>
                <Text style={{ fontSize: 22 }}>{mealEmoji(d.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{d.name}</Text>
                <Text style={styles.sub}>
                  {d.analysis.estimated_weight_grams} g · {d.analysis.calories} kcal · P {d.analysis.protein_g}g
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textFaint} />
            </Pressable>
            </FadeInUp>
          );
        })}
        {shown.length === 0 && <Text style={styles.sub}>{tr('Nenhum prato encontrado.')}</Text>}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    row: { ...cardBase(colors), flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: font.h3, fontWeight: '600', color: colors.text },
    sub: { fontSize: font.small, color: colors.textMuted },
  });
