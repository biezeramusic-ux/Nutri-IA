import { useRouter } from 'expo-router';
import { CloudOff, Plus, Star, Trash } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProBadge } from '../../components/ProOverlay';
import { WeekStrip } from '../../components/WeekStrip';
import { SCREEN_PADDING, TAB_BAR_SPACE, cardBase, font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { FREE_MEALS_TOTAL } from '../../constants/plans';
import { useDiary } from '../../hooks/useDiary';
import { useFavorites } from '../../hooks/useFavorites';
import { useProfile } from '../../hooks/useProfile';
import { useSubscription } from '../../hooks/useSubscription';
import { todayKey } from '../../services/date';
import { MEAL_TYPES, dayKeyOf, getMealType, mealsOfDay, sumMeals, weekDays } from '../../services/dayUtils';
import { favoriteToMeal } from '../../services/favorites';
import { mealEmoji } from '../../services/foodCatalog';
import { dayScore } from '../../services/healthScore';
import type { Meal } from '../../types';
import { tr } from '../../i18n';

export default function DiaryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals, setCurrent, removeMeal, saveMeal, pendingCount } = useDiary();
  const { favorites } = useFavorites();
  const { goals } = useProfile();
  const { isPro, mealsLeft, refresh } = useSubscription();
  const [selected, setSelected] = useState(() => new Date());

  const selectedKey = todayKey(selected);
  const isToday = selectedKey === todayKey();
  const days = useMemo(() => weekDays(new Date()), []);
  const dayMeals = useMemo(() => mealsOfDay(meals, selectedKey), [meals, selectedKey]);
  const totals = useMemo(() => sumMeals(dayMeals), [dayMeals]);

  const progressByDay = useMemo(() => {
    const byDay: Record<string, number> = {};
    meals.forEach((m) => {
      const key = dayKeyOf(m.createdAt);
      byDay[key] = (byDay[key] ?? 0) + m.analysis.calories / goals.calories;
    });
    return byDay;
  }, [meals, goals.calories]);

  const selectDay = (day: Date) => {
    if (!isPro && todayKey(day) !== todayKey()) {
      Alert.alert(tr('Histórico completo é Pro'), tr('No teste grátis só vê o dia de hoje. Com o Nutri IA Pro tem o histórico completo das refeições.'), [
        { text: tr('Agora não'), style: 'cancel' },
        { text: tr('Ver planos'), onPress: () => router.push('/paywall') },
      ]);
      return;
    }
    setSelected(day);
  };

  const score = useMemo(() => dayScore(dayMeals.map((m) => m.analysis)), [dayMeals]);

  const addFavorite = async (index: number) => {
    const fav = favorites[index];
    if (!fav) return;
    try {
      await saveMeal(favoriteToMeal(fav));
      void refresh();
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

  const open = (meal: Meal) => {
    setCurrent(meal);
    router.push({ pathname: '/details', params: { id: meal.id } });
  };

  const confirmDelete = (meal: Meal) =>
    Alert.alert(tr('Apagar refeição'), tr('Quer apagar "{name}" do diário?', { name: meal.analysis.food_name }), [
      { text: tr('Cancelar'), style: 'cancel' },
      {
        text: tr('Apagar'),
        style: 'destructive',
        onPress: () =>
          removeMeal(meal.id)
            .then(() => refresh())
            .catch(() => Alert.alert(tr('Não foi possível apagar'), tr('Verifique a ligação à internet.'))),
      },
    ]);

  const kcalPct = Math.min(1, totals.kcal / goals.calories);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: SCREEN_PADDING, paddingBottom: TAB_BAR_SPACE + 24, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{tr('Diário alimentar 📖')}</Text>
      <WeekStrip days={days} selectedKey={selectedKey} onSelect={selectDay} progressByDay={progressByDay} />

      {pendingCount > 0 && (
        <View style={styles.pending}>
          <CloudOff size={14} color={colors.carbs} />
          <Text style={styles.pendingText}>
            {pendingCount} {tr(pendingCount === 1 ? 'refeição por sincronizar' : 'refeições por sincronizar')} {tr('(sem ligação)')}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.totalTop}>
          <View>
            <Text style={styles.cardLabel}>{isToday ? 'Total de hoje' : 'Total do dia'}</Text>
            <Text style={styles.big}>
              {totals.kcal} <Text style={styles.unit}>/ {goals.calories} kcal</Text>
            </Text>
          </View>
          {score !== null && (
            <View style={styles.scoreChip}>
              <Text style={styles.scoreChipText}>{tr('Pontuação {score}/10', { score: String(score).replace('.', ',') })}</Text>
            </View>
          )}
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${kcalPct * 100}%`, backgroundColor: totals.kcal > goals.calories ? colors.danger : colors.primary }]} />
        </View>
        <View style={styles.macros}>
          <View style={styles.macro}>
            <Text style={styles.macroValue}>{totals.carbs}g</Text>
            <Text style={styles.macroLabel}>{tr('Carbs')}</Text>
          </View>
          <View style={styles.macro}>
            <Text style={styles.macroValue}>{totals.protein}g</Text>
            <Text style={styles.macroLabel}>{tr('Proteínas')}</Text>
          </View>
          <View style={styles.macro}>
            <Text style={styles.macroValue}>{totals.fats}g</Text>
            <Text style={styles.macroLabel}>{tr('Gorduras')}</Text>
          </View>
          <View style={styles.macro}>
            {isPro ? <Text style={styles.macroValue}>{Math.round(totals.fiber * 10) / 10}g</Text> : <ProBadge />}
            <Text style={styles.macroLabel}>{tr('Fibras')}</Text>
          </View>
        </View>
        {!isPro && mealsLeft !== null && (
          <Text style={styles.limit}>
            {tr('Plano grátis: {n} de {total} registos disponíveis durante o teste.', { n: Math.max(0, mealsLeft), total: FREE_MEALS_TOTAL })}
          </Text>
        )}
      </View>

      {isToday && favorites.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={styles.favHead}>
            <Star size={14} color={colors.carbs} fill={colors.carbs} />
            <Text style={styles.favTitle}>{tr('Favoritas · registo rápido')}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {favorites.slice(0, 12).map((f, i) => (
              <Pressable key={f.id} style={styles.favChip} onPress={() => void addFavorite(i)}>
                <Text style={styles.favName} numberOfLines={1}>{f.analysis.food_name}</Text>
                <Text style={styles.favKcal}>{f.analysis.calories} kcal · +</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {MEAL_TYPES.map((t) => {
        const list = dayMeals.filter((m) => getMealType(m.createdAt) === t.type);
        const kcal = list.reduce((s, m) => s + m.analysis.calories, 0);
        return (
          <View key={t.type} style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIcon}>
                <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
              </View>
              <Text style={styles.sectionTitle}>{t.label}</Text>
              <Text style={styles.sectionKcal}>{kcal > 0 ? `${kcal} kcal` : ''}</Text>
              <Pressable style={styles.add} onPress={() => router.navigate('/scanner')} hitSlop={8} accessibilityLabel={`Adicionar ${t.label}`}>
                <Plus size={16} color={colors.text} />
              </Pressable>
            </View>
            {list.length === 0 ? (
              <Text style={styles.empty}>{tr('Nada registado')}</Text>
            ) : (
              list.map((m) => (
                <Pressable key={m.id} onPress={() => open(m)} style={styles.row}>
                  {m.photoUri ? (
                    <Image source={{ uri: m.photoUri }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Text style={{ fontSize: 18 }}>{mealEmoji(m.analysis.food_name)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealName} numberOfLines={1}>
                      {m.analysis.food_name}
                    </Text>
                    <Text style={styles.mealSub}>
                      {m.analysis.estimated_weight_grams} g · {m.analysis.calories} kcal
                    </Text>
                  </View>
                  <Pressable onPress={() => confirmDelete(m)} hitSlop={10} accessibilityLabel={tr('Apagar refeição')}>
                    <Trash size={16} color={colors.textFaint} />
                  </Pressable>
                </Pressable>
              ))
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  pending: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.limeSoft, borderRadius: radius.md, padding: 10 },
  pendingText: { flex: 1, fontSize: font.small, color: colors.text },
  scoreChip: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  scoreChipText: { fontSize: font.tiny, fontWeight: '700', color: colors.primaryDark },
  favHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  favTitle: { fontSize: font.small, fontWeight: '700', color: colors.textMuted },
  favChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 190 },
  favName: { fontSize: font.body, fontWeight: '600', color: colors.text },
  favKcal: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },

  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: font.h1, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  card: { ...cardBase(colors), padding: 16, gap: 12 },
  totalTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontSize: font.small, fontWeight: '500', color: colors.textMuted },
  big: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  unit: { fontSize: font.body, fontWeight: '500', color: colors.textMuted },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  macros: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 10 },
  macro: { flex: 1, alignItems: 'center', gap: 2, justifyContent: 'center' },
  macroValue: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  macroLabel: { fontSize: font.tiny, color: colors.textMuted },
  limit: { fontSize: font.small, color: colors.textMuted },
  section: { ...cardBase(colors), padding: 14, gap: 10, borderRadius: radius.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, fontSize: font.h3, fontWeight: '600', color: colors.text },
  sectionKcal: { fontSize: font.small, color: colors.textMuted },
  add: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: font.small, color: colors.textFaint },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 40, height: 40, borderRadius: 20 },
  thumbPlaceholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  mealName: { fontSize: font.body, fontWeight: '600', color: colors.text },
  mealSub: { fontSize: font.small, color: colors.textMuted },
});
