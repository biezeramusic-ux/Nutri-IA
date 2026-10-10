import { Plus, Star, Trash } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useDiary } from '../hooks/useDiary';
import { useFavorites } from '../hooks/useFavorites';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../hooks/useTheme';
import { favoriteToMeal } from '../services/favorites';

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
      Alert.alert('Registado', `${fav.analysis.food_name} foi adicionado ao diário de hoje.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('meal_limit_reached') || message.includes('trial_expired')) {
        Alert.alert('Limite do teste grátis', 'Com o Nutri IA Pro os registos são ilimitados.', [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Ver planos', onPress: () => router.push('/paywall') },
        ]);
      } else {
        Alert.alert('Não foi possível registar', 'Tente novamente.');
      }
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Refeições favoritas" />
        {favorites.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', gap: 8 }]}>
            <Star size={28} color={colors.carbs} />
            <Text style={styles.title}>Ainda não tem favoritas</Text>
            <Text style={styles.sub}>Abra uma refeição e toque na estrela para a guardar. Depois registe-a com um toque, sem fotografar.</Text>
          </View>
        ) : (
          favorites.map((f, i) => (
            <View key={f.id} style={[styles.card, styles.row]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{f.analysis.food_name}</Text>
                <Text style={styles.sub}>
                  {f.analysis.estimated_weight_grams} g · {f.analysis.calories} kcal · P {f.analysis.protein_g}g · C {f.analysis.carbs_g}g · G {f.analysis.fats_g}g
                </Text>
              </View>
              <Pressable style={styles.add} onPress={() => void addToToday(i)} accessibilityLabel="Registar hoje">
                <Plus size={18} color="#fff" />
              </Pressable>
              <Pressable onPress={() => void remove(f.id)} hitSlop={10} accessibilityLabel="Remover">
                <Trash size={18} color={colors.textFaint} />
              </Pressable>
            </View>
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
    add: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  });
