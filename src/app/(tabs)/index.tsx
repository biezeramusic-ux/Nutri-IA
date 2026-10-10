import { Activity, Camera, Droplets, Star, Target, UtensilsCrossed } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Pressable } from '../../components/AppPressable';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaloriesCard } from '../../components/CaloriesCard';
import { LockOverlay } from '../../components/LockOverlay';
import { Logo } from '../../components/Logo';
import { MealSection } from '../../components/MealSection';
import { ProBadge } from '../../components/ProOverlay';
import { ScanCard } from '../../components/ScanCard';
import { StreakCard } from '../../components/StreakCard';
import { SearchBar } from '../../components/SearchBar';
import { WaterMiniCard } from '../../components/WaterMiniCard';
import { WaterReminderCard } from '../../components/WaterReminderCard';
import { WeekStrip } from '../../components/WeekStrip';
import { SCREEN_PADDING, TAB_BAR_SPACE, cardBase, font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useDiary } from '../../hooks/useDiary';
import { useNotificationPermission } from '../../hooks/useNotificationPermission';
import { useProfile } from '../../hooks/useProfile';
import { useSubscription } from '../../hooks/useSubscription';
import { useWater } from '../../hooks/useWater';
import { todayKey } from '../../services/date';
import { MEAL_TYPES, dayKeyOf, getMealType, mealsOfDay, sumMeals, weekDays } from '../../services/dayUtils';
import { analyzeFromText, buildMeal } from '../../services/foodCatalog';
import { ensureNotificationPermission, notificationsSupported } from '../../services/notifications';
import { reminderPitch } from '../../services/reminderPitch';
import { computeStreak } from '../../services/streak';
import type { Meal } from '../../types';
import { tr } from '../../i18n';
import { FadeInUp } from '../../components/Motion';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals, setCurrent, loading: diaryLoading, error: diaryError, refresh } = useDiary();
  const { displayName } = useAuth();
  const { profile, goals, saveReminders } = useProfile();
  const water = useWater();
  const permission = useNotificationPermission();
  const { lockReason, isPremium, isPro, trialDaysLeft, scansLeftToday, loading: accessLoading } = useSubscription();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Date());
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [activating, setActivating] = useState(false);

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

  const streak = useMemo(() => computeStreak(meals), [meals]);
  const firstName = displayName.split(' ')[0];

  const chipLabel = accessLoading
    ? '…'
    : isPremium
      ? 'Premium'
      : lockReason === 'trial_expired'
        ? 'Teste terminado'
        : tr('Teste: {days} d · {scans} scans hoje', { days: trialDaysLeft, scans: scansLeftToday ?? 0 });

  const remindersActive = !!profile?.waterReminders && permission.granted;
  const showReminderCard = isPro && !!profile?.onboardingCompleted && !reminderDismissed && !remindersActive;

  const activateReminders = async () => {
    if (!notificationsSupported) {
      Alert.alert(
        'Disponível na app instalada',
        tr('As notificações não funcionam no Expo Go. Quando instalar a app (APK), os lembretes funcionam.'),
      );
      return;
    }
    setActivating(true);
    try {
      if (!(await ensureNotificationPermission(true))) {
        Alert.alert(tr('Notificações desligadas'), tr('Ative as notificações do Nutri IA nas definições do telemóvel.'));
        return;
      }
      if (profile) {
        await saveReminders({ waterReminders: true, wakeHour: profile.wakeHour, sleepHour: profile.sleepHour });
      }
      await permission.refresh();
    } catch {
      Alert.alert(tr('Não foi possível ativar'), tr('Verifique a ligação à internet e tente novamente.'));
    } finally {
      setActivating(false);
    }
  };

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
      Alert.alert(tr('Alimento não encontrado'), tr('Tente por exemplo: "xima com matapa", "peixe grelhado" ou "arroz com feijão".'));
      return;
    }
    setQuery('');
    openMeal(buildMeal(analysis));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: TAB_BAR_SPACE + 24, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={diaryLoading} onRefresh={() => void refresh()} tintColor={colors.primary} />}
      >
        <FadeInUp delay={0} style={[styles.pad, styles.header]}>
          <Logo size={34} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>{firstName ? tr('Olá, {name} 👋', { name: firstName }) : tr('Olá 👋')}</Text>
            <Text style={styles.chipText}>{chipLabel}</Text>
          </View>
        </FadeInUp>

        <FadeInUp delay={60} style={styles.pad}>
          <WeekStrip days={days} selectedKey={selectedKey} onSelect={setSelected} progressByDay={progressByDay} />
        </FadeInUp>

        <FadeInUp delay={120} style={styles.pad}>
          <CaloriesCard goals={goals} consumed={consumed} />
        </FadeInUp>

        <FadeInUp delay={180} style={styles.pad}>
          <StreakCard streak={streak} />
        </FadeInUp>

        {showReminderCard && (
          <View style={styles.pad}>
            <WaterReminderCard
              text={reminderPitch(profile?.goal ?? null, profile?.quiz?.habits ?? null, goals.waterMl)}
              busy={activating}
              onActivate={() => void activateReminders()}
              onDismiss={() => setReminderDismissed(true)}
            />
          </View>
        )}

        <FadeInUp delay={240} style={[styles.pad, styles.row]}>
          {isPro ? (
            <WaterMiniCard glasses={water.glasses} goalGlasses={water.goalGlasses} onAdd={water.increment} onOpen={() => router.push('/water')} />
          ) : (
            <Pressable style={styles.lockedCard} onPress={() => router.push('/paywall')}>
              <View style={styles.lockedHead}>
                <Text style={styles.statTitle}>{tr('Água')}</Text>
                <ProBadge />
              </View>
              <Droplets size={22} color={colors.water} />
              <Text style={styles.statLabel}>{tr('Registo de água e lembretes no plano Pro')}</Text>
            </Pressable>
          )}
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>{tr('Refeições')}</Text>
            <View>
              <Text style={styles.statValue}>{dayMeals.length}</Text>
              <Text style={styles.statLabel}>{isToday ? 'registadas hoje' : 'registadas neste dia'}</Text>
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={300} style={[styles.pad, styles.shortcuts]}>
          <Pressable style={styles.shortcut} onPress={() => router.push('/goals')}>
            <Target size={18} color={colors.primary} />
            <Text style={styles.shortcutText}>{tr('Objetivos')}</Text>
          </Pressable>
          <Pressable style={styles.shortcut} onPress={() => router.push(isPro ? '/activity' : '/paywall')}>
            <Activity size={18} color={colors.primary} />
            <Text style={styles.shortcutText}>{tr('Atividade')}</Text>
            {!isPro && <ProBadge />}
          </Pressable>
          <Pressable style={styles.shortcut} onPress={() => router.push(isPro ? '/water' : '/paywall')}>
            <Droplets size={18} color={colors.water} />
            <Text style={styles.shortcutText}>{tr('Água')}</Text>
            {!isPro && <ProBadge />}
          </Pressable>
        </FadeInUp>

        <FadeInUp delay={360} style={[styles.pad, { gap: 12 }]}>
          <Text style={styles.title}>{tr('Vamos ver a sua refeição juntos')}</Text>
          <SearchBar value={query} onChangeText={setQuery} onSubmit={handleSearch} />
          <View style={styles.links}>
            <Pressable style={styles.linkChip} onPress={() => router.push('/dishes')}>
              <UtensilsCrossed size={14} color={colors.primaryDark} />
              <Text style={styles.linkChipText}>{tr('Pratos moçambicanos')}</Text>
            </Pressable>
            <Pressable style={styles.linkChip} onPress={() => router.push('/favorites')}>
              <Star size={14} color={colors.carbs} />
              <Text style={styles.linkChipText}>{tr('Favoritas')}</Text>
            </Pressable>
          </View>
        </FadeInUp>

        <FadeInUp delay={420} style={[styles.pad, { gap: 10 }]}>
          <Text style={styles.section}>{isToday ? 'Refeições de hoje 🍽️' : 'Refeições do dia 🍽️'}</Text>
          {MEAL_TYPES.map((t) => (
            <MealSection
              key={t.type}
              label={t.label}
              emoji={t.emoji}
              meals={dayMeals.filter((m) => getMealType(m.createdAt) === t.type)}
              onAdd={() => router.navigate('/scanner')}
              onOpenMeal={openMeal}
            />
          ))}
        </FadeInUp>

        <FadeInUp delay={480} style={{ gap: 10 }}>
          <Text style={[styles.section, styles.pad]}>{tr('Últimos scans')}</Text>
          {diaryError && <Text style={[styles.error, styles.pad]}>{diaryError}</Text>}
          {meals.length === 0 ? (
            <View style={styles.pad}>
              <View style={styles.empty}>
                <Camera size={28} color={colors.primary} />
                <Text style={styles.emptyTitle}>{tr('Ainda sem scans')}</Text>
                <Text style={styles.emptyBody}>{tr('Toque no botão verde para fotografar a sua primeira refeição.')}</Text>
              </View>
            </View>
          ) : (
            <FlatList
              horizontal
              data={meals.slice(0, 12)}
              keyExtractor={(m) => m.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => <ScanCard meal={item} onPress={() => openMeal(item)} />}
            />
          )}
        </FadeInUp>
      </ScrollView>
      {lockReason === 'trial_expired' && <LockOverlay reason="trial_expired" />}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  links: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  linkChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  linkChipText: { fontSize: font.small, fontWeight: '600', color: colors.text },
  root: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: SCREEN_PADDING },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hello: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  chipText: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
  row: { flexDirection: 'row', gap: 12 },
  statCard: { ...cardBase(colors), flex: 1, padding: 14, justifyContent: 'space-between', backgroundColor: colors.limeSoft, borderColor: colors.border },
  statTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: font.tiny, color: colors.textMuted },
  lockedCard: { ...cardBase(colors), flex: 1, padding: 14, gap: 8 },
  lockedHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shortcuts: { flexDirection: 'row', gap: 10 },
  shortcut: { ...cardBase(colors), flex: 1, borderRadius: radius.lg, paddingVertical: 12, alignItems: 'center', gap: 6 },
  shortcutText: { fontSize: font.small, fontWeight: '600', color: colors.text },
  title: { fontSize: font.h1, lineHeight: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  section: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  error: { fontSize: font.small, color: colors.danger },
  carousel: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 4 },
  empty: { ...cardBase(colors), padding: 22, alignItems: 'center', gap: 4, borderRadius: radius.card },
  emptyTitle: { fontSize: font.h3, fontWeight: '600', color: colors.text },
  emptyBody: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
});
