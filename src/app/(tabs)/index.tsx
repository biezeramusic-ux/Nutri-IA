import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaloriesCard } from '../../components/CaloriesCard';
import { LockOverlay } from '../../components/LockOverlay';
import { Logo } from '../../components/Logo';
import { MealSection } from '../../components/MealSection';
import { ScanCard } from '../../components/ScanCard';
import { SearchBar } from '../../components/SearchBar';
import { WaterMiniCard } from '../../components/WaterMiniCard';
import { WeekStrip } from '../../components/WeekStrip';
import { TAB_BAR_SPACE, colors, radius, shadow } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useDiary } from '../../hooks/useDiary';
import { useProfile } from '../../hooks/useProfile';
import { useSubscription } from '../../hooks/useSubscription';
import { useWater } from '../../hooks/useWater';
import { todayKey } from '../../services/date';
import { MEAL_TYPES, dayKeyOf, getMealType, mealsOfDay, sumMeals, weekDays } from '../../services/dayUtils';
import { analyzeFromText, buildMeal } from '../../services/foodCatalog';
import type { Meal } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals, setCurrent, loading: diaryLoading, error: diaryError, refresh } = useDiary();
  const { displayName } = useAuth();
  const { goals } = useProfile();
  const water = useWater();
  const { lockReason, isPremium, trialDaysLeft, scansLeftToday, loading: accessLoading } = useSubscription();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Date());

  const selectedKey = todayKey(selected);
  const isToday = selectedKey === todayKey();
  const days = useMemo(() => weekDays(new Date()), []);
  const dayMeals = useMemo(() => mealsOfDay(meals, selectedKey), [meals, selectedKey]);
  const consumed = useMemo(() => sumMeals(dayMeals), [dayMeals]);

  const progressByDay = useMemo(() => {
    const byDay: Record<string, number> = {};
    meals.forEach((m) => {
      const key = dayKeyOf(m.createdAt);
      byDay[key] = (byDay[key] ?? 0) + m.analysis.calories / goals.calories;
    });
    return byDay;
  }, [meals, goals.calories]);

  const firstName = displayName.split(' ')[0];

  const chipLabel = accessLoading
    ? '…'
    : isPremium
      ? 'Premium'
      : lockReason === 'trial_expired'
        ? 'Teste terminado'
        : `Teste: ${trialDaysLeft}d · ${scansLeftToday ?? 0} scans hoje`;

  const openMeal = (meal: Meal) => {
    setCurrent(meal);
    router.push({ pathname: '/details', params: { id: meal.id } });
  };

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
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: TAB_BAR_SPACE + 40, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={diaryLoading} onRefresh={() => void refresh()} tintColor={colors.primary} />
        }
      >
        <View style={[styles.pad, styles.header]}>
          <Logo size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>{firstName ? `Olá, ${firstName} 👋` : 'Olá 👋'}</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{chipLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pad}>
          <WeekStrip days={days} selectedKey={selectedKey} onSelect={setSelected} progressByDay={progressByDay} />
        </View>

        <View style={styles.pad}>
          <CaloriesCard goals={goals} consumed={consumed} />
        </View>

        <View style={[styles.pad, styles.twoCols]}>
          <View style={{ flex: 1 }}>
            <WaterMiniCard
              glasses={water.glasses}
              goalGlasses={water.goalGlasses}
              onAdd={water.increment}
              onOpen={() => router.navigate('/water')}
            />
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <View style={styles.statIcon}>
              <Ionicons name="restaurant" size={18} color={colors.limeDark} />
            </View>
            <Text style={styles.statValue}>{dayMeals.length}</Text>
            <Text style={styles.statLabel}>{dayMeals.length === 1 ? 'refeição' : 'refeições'} {isToday ? 'hoje' : 'neste dia'}</Text>
          </View>
        </View>

        <View style={styles.pad}>
          <Text style={styles.title}>Let's Check Your Meal Together</Text>
          <SearchBar value={query} onChangeText={setQuery} onSubmit={handleSearch} />
        </View>

        <View style={[styles.pad, { gap: 12 }]}>
          <Text style={styles.section}>{isToday ? 'Refeições de hoje' : 'Refeições do dia'}</Text>
          {MEAL_TYPES.map((t) => (
            <MealSection
              key={t.type}
              label={t.label}
              icon={t.icon}
              meals={dayMeals.filter((m) => getMealType(m.createdAt) === t.type)}
              onAdd={() => router.navigate('/scanner')}
              onOpenMeal={openMeal}
            />
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <Text style={[styles.section, styles.pad]}>Last Scans</Text>
          {diaryError && <Text style={[styles.error, styles.pad]}>{diaryError}</Text>}
          {meals.length === 0 ? (
            <View style={[styles.empty, styles.pad]}>
              <Ionicons name="camera-outline" size={34} color={colors.primary} />
              <Text style={styles.emptyTitle}>Ainda sem scans</Text>
              <Text style={styles.emptyBody}>Toque no botão verde para fotografar a sua primeira refeição.</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={meals.slice(0, 12)}
              keyExtractor={(m) => m.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
              renderItem={({ item }) => <ScanCard meal={item} onPress={() => openMeal(item)} />}
            />
          )}
        </View>
      </ScrollView>
      {lockReason === 'trial_expired' && <LockOverlay reason="trial_expired" />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hello: { fontSize: 18, fontWeight: '800', color: colors.text },
  chip: { alignSelf: 'flex-start', backgroundColor: colors.limeSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.limeDark },
  twoCols: { flexDirection: 'row', gap: 14 },
  statCard: { backgroundColor: colors.limeSoft, borderRadius: radius.card, padding: 16, justifyContent: 'space-between' },
  statIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 30, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 14 },
  section: { fontSize: 20, fontWeight: '800', color: colors.text },
  error: { fontSize: 12, color: colors.danger },
  carousel: { paddingHorizontal: 20, paddingBottom: 6 },
  empty: { backgroundColor: colors.card, borderRadius: radius.card, padding: 28, alignItems: 'center', gap: 6, marginHorizontal: 20, ...shadow },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
