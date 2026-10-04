import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockOverlay } from '../../components/LockOverlay';
import { MealCard } from '../../components/MealCard';
import { SearchBar } from '../../components/SearchBar';
import { TAB_BAR_SPACE, colors, radius, shadow } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useDiary } from '../../hooks/useDiary';
import { useSubscription } from '../../hooks/useSubscription';
import { analyzeFromText, buildMeal } from '../../services/foodCatalog';
import type { Meal } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals, setCurrent, loading: diaryLoading, error: diaryError, refresh } = useDiary();
  const { displayName, signOut } = useAuth();
  const { lockReason, isPremium, trialDaysLeft, scansLeftToday, loading: accessLoading } = useSubscription();
  const [query, setQuery] = useState('');

  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayMeals = meals.filter((m) => m.createdAt >= todayStart);
  const todayKcal = todayMeals.reduce((sum, m) => sum + m.analysis.calories, 0);

  const openMeal = (meal: Meal) => {
    setCurrent(meal);
    router.push({ pathname: '/details', params: { id: meal.id } });
  };

  const confirmSignOut = () =>
    Alert.alert('Terminar sessão', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);

  const chipLabel = accessLoading
    ? '…'
    : isPremium
      ? 'Premium'
      : lockReason === 'trial_expired'
        ? 'Teste terminado'
        : `Teste: ${trialDaysLeft}d · ${scansLeftToday ?? 0} scans hoje`;

  const handleSearch = () => {
    if (lockReason === 'trial_expired') return router.push('/paywall');
    const text = query.trim();
    if (!text) return;
    const analysis = analyzeFromText(text);
    if (!analysis) {
      Alert.alert('Alimento não encontrado', 'Tente por exemplo: "xima com matapa", "peixe grelhado" ou "arroz com feijão".');
      return;
    }
    setQuery('');
    openMeal(buildMeal(analysis));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={diaryLoading} onRefresh={() => void refresh()} tintColor={colors.primary} />
        }
      >
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="leaf" size={18} color="#fff" />
          </View>
          <Text style={styles.brand}>Nutri AI</Text>
          <View style={styles.trialChip}>
            <Text style={styles.trialText}>{chipLabel}</Text>
          </View>
          <Ionicons name="log-out-outline" size={22} color={colors.textMuted} onPress={confirmSignOut} />
        </View>

        {!!displayName && <Text style={styles.greeting}>Olá, {displayName.split(' ')[0]} 👋</Text>}
        <Text style={styles.title}>Let's Check Your Meal Together</Text>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={handleSearch} />

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Calorias de hoje</Text>
            <Text style={styles.summaryValue}>{todayKcal} kcal</Text>
          </View>
          <View style={styles.summaryIcon}>
            <Ionicons name="flame" size={26} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.section}>Last Scans</Text>
        {diaryError && <Text style={styles.error}>{diaryError}</Text>}
        {meals.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={34} color={colors.primary} />
            <Text style={styles.emptyTitle}>Ainda sem scans</Text>
            <Text style={styles.emptyBody}>Toque no botão verde para fotografar a sua primeira refeição.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {meals.slice(0, 20).map((meal) => (
              <MealCard key={meal.id} meal={meal} onPress={() => openMeal(meal)} />
            ))}
          </View>
        )}
      </ScrollView>
      {lockReason === 'trial_expired' && <LockOverlay reason="trial_expired" />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  logo: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 },
  trialChip: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  trialText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  greeting: { fontSize: 14, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  error: { fontSize: 12, color: colors.danger, marginBottom: 10 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: colors.text, marginBottom: 20, letterSpacing: -0.5 },
  summary: {
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow,
  },
  summaryLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  summaryValue: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2 },
  summaryIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 28, marginBottom: 14 },
  list: { gap: 14 },
  empty: { backgroundColor: colors.card, borderRadius: radius.card, padding: 28, alignItems: 'center', gap: 6, ...shadow },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
