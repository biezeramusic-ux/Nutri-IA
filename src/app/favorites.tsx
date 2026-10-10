import { Plus, Star, Trash } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { Text } from '../components/AppText';
import { Alert } from '../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInUp } from '../components/Motion';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useDiary } from '../hooks/useDiary';
import { useFavorites } from '../hooks/useFavorites';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../hooks/useTheme';
import { favoriteToMeal } from '../services/favorites';
import { mealEmoji } from '../services/foodCatalog';
import { tr } from '../i18n';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, remove } = useFavorites();
  const { saveMeal } = useDiary();
  const { refresh } = useSubscription();

  const addToToday = async (index: number) => {
    const fav = favorites[index];
    if (!fav) return;
    try {
      await saveMeal(favoriteToMeal(fav));
      void refresh();
      Alert.alert(tr('Registado'), tr('{name} foi adicionado ao diário de hoje.', { name: fav.analysis.food_name }));
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('meal_limit_reached') || message.includes('trial_expired')) {
        Alert.alert(tr('Limite do teste grátis'), tr('Com o Nutri IA Pro os registos são ilimitados.'), [
          { text: tr('Agora não'), style: 'cancel' },
          { text: tr('Ver planos'), onPress: () => router.push('/paywall') },
        ]);
      } else {
        Alert.alert(tr('Não foi possível registar'), tr('Tente novamente.'));
      }
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={tr('Refeições favoritas')} />
        {favorites.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', gap: 8 }]}>
            <Text style={{ fontSize: 34 }}>⭐</Text>
            <Text style={styles.title}>{tr('Ainda não tem favoritas')}</Text>
            <Text style={styles.sub}>{tr('Abra uma refeição e toque na estrela para a guardar. Depois registe-a com um toque, sem fotografar.')}</Text>
          </View>
        ) : (
          favorites.map((f, i) => (
            <FadeInUp key={f.id} delay={Math.min(i * 50, 500)} style={[styles.card, styles.row]}>
              <View style={styles.emojiWrap}>
                <Text style={{ fontSize: 22 }}>{mealEmoji(f.analysis.food_name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{f.analysis.food_name}</Text>
                <Text style={styles.sub}>
                  {f.analysis.estimated_weight_grams} g · {f.analysis.calories} kcal · P {f.analysis.protein_g}g · C {f.analysis.carbs_g}g · G {f.analysis.fats_g}g
                </Text>
              </View>
              <Pressable style={styles.add} onPress={() => void addToToday(i)} accessibilityLabel={tr('Registar hoje')}>
                <Plus size={18} color="#fff" />
              </Pressable>
              <Pressable onPress={() => void remove(f.id)} hitSlop={10} accessibilityLabel={tr('Remover')}>
                <Trash size={18} color={colors.textFaint} />
              </Pressable>
            </FadeInUp>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    card: { ...cardBase(colors), padding: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { fontSize: font.h3, fontWeight: '600', color: colors.text },
    sub: { fontSize: font.small, color: colors.textMuted, marginTop: 2, textAlign: 'left' },
    emojiWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
    add: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  });
