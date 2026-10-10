import { Camera, Scale, Share2, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, type Bar } from '../../components/BarChart';
import { LineChart } from '../../components/LineChart';
import { ProGate } from '../../components/ProOverlay';
import { NumberStepper } from '../../components/quiz/NumberStepper';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StreakCard } from '../../components/StreakCard';
import { SCREEN_PADDING, TAB_BAR_SPACE, cardBase, font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useDiary } from '../../hooks/useDiary';
import { useReferral } from '../../hooks/useReferral';
import { useProfile } from '../../hooks/useProfile';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { todayKey } from '../../services/date';
import { WEEKDAY_LABELS, mealsOfDay, sumMeals, weekDays } from '../../services/dayUtils';
import { buildProgressSummary } from '../../services/progressSummary';
import { computeStreak } from '../../services/streak';
import { buildWeeklyReport } from '../../services/weeklyReport';
import { tr } from '../../i18n';

type Period = 'week' | 'month';

function lastDays(count: number): Date[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (count - 1 - i)));
}

const shortDate = (key: string) => {
  const [, m, d] = key.split('-');
  return `${d}/${m}`;
};

export default function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { meals } = useDiary();
  const { displayName } = useAuth();
  const referral = useReferral();
  const streak = useMemo(() => computeStreak(meals), [meals]);
  const { goals, profile } = useProfile();
  const { logs, addToday } = useWeightLogs(90);
  const [period, setPeriod] = useState<Period>('week');
  const [logging, setLogging] = useState(false);
  const [draftWeight, setDraftWeight] = useState<number | null>(null);

  const today = todayKey();
  const days = period === 'week' ? weekDays(new Date()) : lastDays(30);

  const data = useMemo(
    () =>
      days.map((d, i) => {
        const key = todayKey(d);
        const dayMeals = mealsOfDay(meals, key);
        return { key, totals: sumMeals(dayMeals), label: period === 'week' ? WEEKDAY_LABELS[i] : String(d.getDate()), isToday: key === today };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meals, period],
  );

  const logged = data.filter((d) => d.totals.kcal > 0);
  const avg = (pick: (t: (typeof data)[number]['totals']) => number) =>
    logged.length ? Math.round(logged.reduce((s, d) => s + pick(d.totals), 0) / logged.length) : 0;
  const avgKcal = avg((t) => t.kcal);
  const avgProtein = avg((t) => t.protein);
  const avgCarbs = avg((t) => t.carbs);
  const avgFats = avg((t) => t.fats);
  const onTarget = logged.filter((d) => {
    const p = d.totals.kcal / goals.calories;
    return p >= 0.8 && p <= 1.1;
  }).length;

  const bars: Bar[] = data.map((d) => ({
    key: d.key,
    label: d.label,
    value: d.totals.kcal,
    highlight: d.isToday,
    caption: `${Math.round((d.totals.kcal / goals.calories) * 100)}%`,
  }));

  const sinceKey = todayKey(lastDays(period === 'week' ? 7 : 30)[0]);
  const periodLogs = logs.filter((l) => l.day >= sinceKey);
  const latest = logs[logs.length - 1];
  const weightDelta = periodLogs.length >= 2 ? periodLogs[periodLogs.length - 1].weightKg - periodLogs[0].weightKg : null;
  const targetWeight = profile?.quiz?.targetWeightKg;

  const summary = buildProgressSummary({
    daysLogged: logged.length,
    avgKcal,
    goalKcal: goals.calories,
    avgProtein,
    goalProtein: goals.proteinG,
    weightDelta,
    goal: profile?.goal ?? null,
    periodLabel: period === 'week' ? 'semana' : 'mês',
  });

  const startLogging = () => {
    setDraftWeight(Math.round((latest?.weightKg ?? profile?.quiz?.weightKg ?? 65) * 2) / 2);
    setLogging(true);
  };
  const saveWeight = async () => {
    if (draftWeight === null) return;
    try {
      await addToday(draftWeight);
      setLogging(false);
    } catch {
      Alert.alert(tr('Não foi possível guardar'), tr('Verifique a ligação à internet e tente novamente.'));
    }
  };

  const chartWidth = width - SCREEN_PADDING * 2 - 32;
  const macroRows = [
    { label: 'Proteína', value: avgProtein, goal: goals.proteinG, color: colors.primary },
    { label: 'Carbs', value: avgCarbs, goal: goals.carbsG, color: colors.carbs },
    { label: 'Gordura', value: avgFats, goal: goals.fatsG, color: colors.protein },
  ];

  return (
    <ProGate feature={tr('Acompanhe calorias, macros e peso ao longo da semana e do mês.')}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: SCREEN_PADDING, paddingBottom: TAB_BAR_SPACE + 24, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{tr('Progresso 📈')}</Text>
        <StreakCard streak={streak} />
        <SegmentedControl
          options={[
            { key: 'week', label: tr('Semana') },
            { key: 'month', label: tr('Mês') },
          ]}
          value={period}
          onChange={setPeriod}
        />

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tr('Calorias · média dos dias com registos')}</Text>
          <View style={styles.bigRow}>
            <Text style={styles.big}>{avgKcal}</Text>
            <Text style={styles.unit}>{tr('kcal')}</Text>
            <Text style={styles.target}>Meta: {goals.calories} kcal</Text>
          </View>
          <BarChart bars={bars} goal={goals.calories} labelEvery={period === 'week' ? 1 : 5} />
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: colors.limeSoft, borderColor: colors.border }]}>
            <Text style={styles.statValue}>{onTarget}</Text>
            <Text style={styles.statLabel}>{tr('dias dentro da meta')}</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.waterSoft, borderColor: colors.border }]}>
            <Text style={styles.statValue}>{logged.length}</Text>
            <Text style={styles.statLabel}>{tr('dias com registos')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tr('Macros · média diária')}</Text>
          {macroRows.map((m) => (
            <View key={m.label} style={{ gap: 5 }}>
              <View style={styles.macroTop}>
                <Text style={styles.macroName}>{m.label}</Text>
                <Text style={styles.macroValue}>
                  {m.value} g <Text style={styles.macroGoal}>/ {m.goal} g</Text>
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(1, m.value / m.goal) * 100}%`, backgroundColor: m.color }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.weightHead}>
            <Scale size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>{tr('Peso')}</Text>
            <Pressable onPress={startLogging} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>{tr('Registar peso')}</Text>
            </Pressable>
          </View>
          {latest ? (
            <>
              <View style={styles.bigRow}>
                <Text style={styles.big}>{latest.weightKg.toString().replace('.', ',')}</Text>
                <Text style={styles.unit}>{tr('kg')}</Text>
                {weightDelta !== null && (
                  <Text style={[styles.target, { color: colors.text }]}>
                    {weightDelta > 0 ? '+' : ''}
                    {weightDelta.toFixed(1).replace('.', ',')} kg no período
                  </Text>
                )}
              </View>
              {periodLogs.length > 0 ? (
                <LineChart
                  points={periodLogs.map((l) => ({ label: shortDate(l.day), value: l.weightKg }))}
                  width={chartWidth}
                  goal={targetWeight}
                />
              ) : (
                <Text style={styles.muted}>{tr('Sem registos de peso neste período.')}</Text>
              )}
              {targetWeight !== undefined && <Text style={styles.muted}>Peso desejado: {targetWeight.toString().replace('.', ',')} kg (linha tracejada)</Text>}
            </>
          ) : (
            <Text style={styles.muted}>{tr('Ainda não registou o peso. Toque em "Registar peso" para começar.')}</Text>
          )}

          {logging && draftWeight !== null && (
            <View style={{ gap: 10 }}>
              <NumberStepper label={tr('O seu peso hoje')} value={draftWeight} unit="kg" min={30} max={300} step={0.5} onChange={setDraftWeight} />
              <View style={styles.actions}>
                <Pressable style={styles.ghost} onPress={() => setLogging(false)}>
                  <Text style={styles.ghostText}>{tr('Cancelar')}</Text>
                </Pressable>
                <Pressable style={styles.primary} onPress={() => void saveWeight()}>
                  <Text style={styles.primaryText}>{tr('Guardar')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.weightHead}>
            <Sparkles size={18} color={colors.limeDark} />
            <Text style={styles.cardTitle}>Resumo {period === 'week' ? 'da semana' : 'do mês'}</Text>
          </View>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>

        <Pressable
          style={styles.shareBtn}
          onPress={() =>
            void Share.share({ message: buildWeeklyReport(meals, goals, displayName.split(' ')[0] ?? '', referral.code || undefined) }).catch(() => undefined)
          }
        >
          <Share2 size={16} color="#fff" />
          <Text style={styles.shareText}>{tr('Partilhar resumo da semana')}</Text>
        </Pressable>
        <Pressable style={styles.photosBtn} onPress={() => router.push('/progress-photos')}>
          <Camera size={16} color={colors.primaryDark} />
          <Text style={styles.photosText}>{tr('Fotos de progresso (antes e depois)')}</Text>
        </Pressable>
      </ScrollView>
    </ProGate>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  shareBtn: { flexDirection: 'row', gap: 8, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  shareText: { color: '#fff', fontWeight: '700', fontSize: font.body },
  photosBtn: { flexDirection: 'row', gap: 8, height: 48, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  photosText: { color: colors.primaryDark, fontWeight: '600', fontSize: font.body },
  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: font.h1, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  card: { ...cardBase(colors), padding: 16, gap: 12 },
  cardLabel: { fontSize: font.small, fontWeight: '500', color: colors.textMuted },
  cardTitle: { flex: 1, fontSize: font.h3, fontWeight: '600', color: colors.text },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  big: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  unit: { fontSize: font.body, fontWeight: '500', color: colors.textMuted },
  target: { marginLeft: 'auto', fontSize: font.small, color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: radius.card, borderWidth: 1, padding: 14, gap: 2 },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: font.small, color: colors.textMuted },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  macroName: { fontSize: font.body, color: colors.text, fontWeight: '500' },
  macroValue: { fontSize: font.body, color: colors.text, fontWeight: '600' },
  macroGoal: { color: colors.textMuted, fontWeight: '400' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  weightHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBtn: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  smallBtnText: { fontSize: font.small, fontWeight: '600', color: colors.primaryDark },
  muted: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8 },
  ghost: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: colors.textMuted, fontWeight: '600', fontSize: font.body },
  primary: { flex: 1.4, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  summaryCard: { backgroundColor: colors.limeSoft, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 },
  summaryText: { fontSize: font.body, color: colors.text, lineHeight: 21 },
});
