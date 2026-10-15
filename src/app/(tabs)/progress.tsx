import { Camera, ChevronDown, ChevronLeft, ChevronRight, Lock, Scale, Share2, Sparkles, Wand2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JourneyChart } from '../../components/JourneyChart';
import { ProgressRing } from '../../components/ProgressRing';
import { WeightChanges } from '../../components/WeightChanges';
import { StackedChart } from '../../components/StackedChart';
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
import { dayKeyOf, mealTypeOf } from '../../services/dayUtils';
import { buildRange, type StatsPeriod } from '../../services/statsRange';
import { basalMetabolicRate } from '../../services/goals';
import { listActivityKcal, listWater } from '../../services/repositories/tracker';
import type { MealType } from '../../types';
import { fetchProgressInsight } from '../../services/aiText';
import { useGoalPlan } from '../../hooks/useGoalPlan';
import { useSubscription } from '../../hooks/useSubscription';
import { buildProgressSummary } from '../../services/progressSummary';
import { computeStreak } from '../../services/streak';
import { buildWeeklyReport } from '../../services/weeklyReport';
import { tr } from '../../i18n';


const MEAL_ORDER: { type: MealType; label: string; color: string }[] = [
  { type: 'breakfast', label: 'Pequeno-almoço', color: '#F6BE3D' },
  { type: 'lunch', label: 'Almoço', color: '#3DBE8B' },
  { type: 'dinner', label: 'Jantar', color: '#7C83F2' },
  { type: 'snack', label: 'Lanche', color: '#FF8A6B' },
];
const MEAL_COLORS = MEAL_ORDER.map((m) => m.color);

type Nut = 'fiber_g' | 'sugar_g' | 'sodium_mg' | 'saturated_fat_g' | 'calcium_mg' | 'iron_mg';
const NUTRIENTS: { key: Nut; label: string; unit: string; color: [string, string] }[] = [
  { key: 'fiber_g', label: 'Fibra', unit: 'g', color: ['#86EFAC', '#16A34A'] },
  { key: 'sugar_g', label: 'Açúcar', unit: 'g', color: ['#FDBA74', '#EA580C'] },
  { key: 'sodium_mg', label: 'Sódio', unit: 'mg', color: ['#C4B5FD', '#7C3AED'] },
  { key: 'saturated_fat_g', label: 'Gord. saturada', unit: 'g', color: ['#FDA4AF', '#E11D48'] },
  { key: 'calcium_mg', label: 'Cálcio', unit: 'mg', color: ['#A5B4FC', '#4F46E5'] },
  { key: 'iron_mg', label: 'Ferro', unit: 'mg', color: ['#FCA5A5', '#B91C1C'] },
];

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
  const { displayName, user } = useAuth();
  const referral = useReferral();
  const streak = useMemo(() => computeStreak(meals), [meals]);
  const last7 = useMemo(() => {
    const logged = new Set(meals.map((m) => dayKeyOf(m.createdAt)));
    const letters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { label: letters[d.getDay()], done: logged.has(todayKey(d)) };
    });
  }, [meals]);
  const { goals, profile } = useProfile();
  const { logs, addToday } = useWeightLogs(400);
  const { isPro } = useSubscription();
  const plan = useGoalPlan();
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [offset, setOffset] = useState(0);
  const [logging, setLogging] = useState(false);
  const [draftWeight, setDraftWeight] = useState<number | null>(null);
  const [nutrient, setNutrient] = useState<Nut>('fiber_g');
  const [section, setSection] = useState<'summary' | 'nutrition' | 'body'>('summary');
  const [macro, setMacro] = useState<'protein' | 'fats' | 'carbs'>('protein');
  const [reportOpen, setReportOpen] = useState(false);
  const [waterByDay, setWaterByDay] = useState<Record<string, number>>({});
  const [burnByDay, setBurnByDay] = useState<Record<string, number>>({});

  const today = todayKey();
  const range = useMemo(() => buildRange(period, offset), [period, offset]);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void listWater(userId, range.fromKey, range.toKey).then((w) => alive && setWaterByDay(w)).catch(() => alive && setWaterByDay({}));
    void listActivityKcal(userId, range.fromKey, range.toKey).then((b) => alive && setBurnByDay(b)).catch(() => alive && setBurnByDay({}));
    return () => {
      alive = false;
    };
  }, [userId, range.fromKey, range.toKey]);

  const byDay = useMemo(() => {
    const map: Record<string, typeof meals> = {};
    meals.forEach((m) => {
      (map[dayKeyOf(m.createdAt)] ??= []).push(m);
    });
    return map;
  }, [meals]);

  /** Por barra: valor por tipo de refeição (média dos dias com registos quando a barra agrupa vários dias). */
  const stackFor = (pick: (m: (typeof meals)[number]) => number): number[][] =>
    range.buckets.map((b) => {
      const loggedDays = b.days.filter((d) => byDay[d]?.length);
      if (loggedDays.length === 0) return MEAL_ORDER.map(() => 0);
      return MEAL_ORDER.map((t) => {
        let sum = 0;
        loggedDays.forEach((d) => byDay[d].forEach((m) => (mealTypeOf(m) === t.type ? (sum += pick(m)) : 0)));
        return Math.round(sum / loggedDays.length);
      });
    });

  const kcalStack = useMemo(() => stackFor((m) => m.analysis.calories), [byDay, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const proteinStack = useMemo(() => stackFor((m) => m.analysis.protein_g), [byDay, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const fatsStack = useMemo(() => stackFor((m) => m.analysis.fats_g), [byDay, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const carbsStack = useMemo(() => stackFor((m) => m.analysis.carbs_g), [byDay, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const nut = NUTRIENTS.find((n) => n.key === nutrient) ?? NUTRIENTS[0];
  const nutStack = useMemo(
    () =>
      range.buckets.map((b) => {
        const loggedDays = b.days.filter((d) => byDay[d]?.length);
        if (loggedDays.length === 0) return [0];
        const sum = loggedDays.reduce((s, d) => s + byDay[d].reduce((a, m) => a + (m.analysis[nutrient] ?? 0), 0), 0);
        return [Math.round((sum / loggedDays.length) * 10) / 10];
      }),
    [byDay, range, nutrient],
  );

  const waterStack = useMemo(
    () =>
      range.buckets.map((b) => {
        const days = b.days.filter((d) => waterByDay[d] !== undefined);
        if (days.length === 0) return [0];
        return [Math.round((days.reduce((s, d) => s + waterByDay[d] * 250, 0) / days.length))];
      }),
    [waterByDay, range],
  );

  const q = profile?.quiz;
  const restKcal = q ? Math.round(basalMetabolicRate(q) * 1.2) : null;
  const burnLine = useMemo(
    () =>
      restKcal === null || period === 'year'
        ? undefined
        : range.buckets.map((b) => (b.days[0] > today ? null : restKcal + (burnByDay[b.days[0]] ?? 0))),
    [restKcal, burnByDay, range, period, today],
  );

  const loggedDays = range.buckets.reduce((n, b) => n + (b.days.some((d) => byDay[d]?.length) ? 1 : 0), 0);
  const totalDays = period === 'year' ? 12 : range.buckets.length;
  const flat = (st: number[][]) => st.filter((s) => s.reduce((a, b) => a + b, 0) > 0).map((s) => s.reduce((a, b) => a + b, 0));
  const avgOf = (st: number[][]) => {
    const v = flat(st);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
  };
  const avgKcal = avgOf(kcalStack);
  const waterVals = waterStack.map((w) => w[0]).filter((v) => v > 0);
  const waterAvg = waterVals.length ? waterVals.reduce((a, b) => a + b, 0) / waterVals.length : 0;
  const avgProtein = avgOf(proteinStack);

  const periodLogs = logs.filter((l) => l.day >= range.fromKey && l.day <= range.toKey);
  const latest = logs[logs.length - 1];
  const weightDelta = periodLogs.length >= 2 ? periodLogs[periodLogs.length - 1].weightKg - periodLogs[0].weightKg : null;
  const wantsTarget = profile?.goal === 'lose_weight' || profile?.goal === 'gain_muscle';
  const targetWeight = wantsTarget ? profile?.quiz?.targetWeightKg : undefined;

  const startWeight = logs[0]?.weightKg ?? profile?.quiz?.weightKg;
  const wantsLose = profile?.goal === 'lose_weight';
  const pathProgress =
    wantsTarget && startWeight !== undefined && latest && targetWeight !== undefined && startWeight !== targetWeight
      ? Math.max(0, Math.min(1, (latest.weightKg - startWeight) / (targetWeight - startWeight)))
      : 0;
  const weightLeft = latest && targetWeight !== undefined ? Math.abs(latest.weightKg - targetWeight) : null;

  const pct = (v: number, goal: number) => (goal > 0 ? Math.round((v / goal) * 100) : 0);
  /** Frase simples por baixo de cada gráfico: o que significa a média frente à meta. */
  const plain = (avg: number, goal: number, unit: string) => {
    if (avg === 0) return tr('Ainda sem registos neste período.');
    const r = pct(avg, goal);
    return r < 85
      ? tr('Média de {avg} {unit} por dia: {pct}% da meta. Está abaixo.', { avg, unit, pct: r })
      : r <= 110
        ? tr('Média de {avg} {unit} por dia: {pct}% da meta. Está no caminho certo.', { avg, unit, pct: r })
        : tr('Média de {avg} {unit} por dia: {pct}% da meta. Está acima.', { avg, unit, pct: r });
  };

  const periodLabel = period === 'week' ? 'semana' : 'mês';
  const summary = buildProgressSummary({
    daysLogged: loggedDays,
    avgKcal,
    goalKcal: goals.calories,
    avgProtein,
    goalProtein: goals.proteinG,
    weightDelta,
    goal: profile?.goal ?? null,
    periodLabel,
  });

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const aiKey = `${period}|${offset}|${loggedDays}|${avgKcal}|${avgProtein}|${weightDelta ?? ''}`;
  useEffect(() => {
    setAiSummary(null);
    if (!isPro || !reportOpen || loggedDays === 0) return;
    let alive = true;
    const t = setTimeout(() => {
      void fetchProgressInsight({
        period: period === 'year' ? 'month' : period,
        daysLogged: loggedDays,
        avgKcal,
        goalKcal: goals.calories,
        avgProtein,
        goalProtein: goals.proteinG,
        weightChangeKg: weightDelta,
        goal: profile?.goal ?? null,
      }).then((txt) => alive && setAiSummary(txt));
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiKey, isPro, reportOpen]);

  const changePeriod = (p: StatsPeriod) => {
    setPeriod(p);
    setOffset(0);
  };

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
  const labels = range.buckets.map((b) => b.label);
  const rotate = period === 'week';
  const legend = (
    <View style={styles.legend}>
      {MEAL_ORDER.map((m) => (
        <View key={m.type} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: m.color }]} />
          <Text style={styles.legendText}>{tr(m.label)}</Text>
        </View>
      ))}
    </View>
  );
  const chart = (props: { stacks: number[][]; goal?: number; line?: (number | null)[]; gradient?: [string, string] }) => (
    <StackedChart width={chartWidth} labels={labels} labelEvery={range.labelEvery} rotate={rotate} colors={MEAL_COLORS} {...props} />
  );
  const isCurrent = offset === 0;

  const macroRings = [
    { key: 'protein' as const, label: 'Proteínas', emoji: '💪', value: avgOf(proteinStack), goal: goals.proteinG, color: '#4C9AFF', stack: proteinStack },
    { key: 'fats' as const, label: 'Gorduras', emoji: '🥑', value: avgOf(fatsStack), goal: goals.fatsG, color: '#F472B6', stack: fatsStack },
    { key: 'carbs' as const, label: 'Carboidratos', emoji: '🍞', value: avgOf(carbsStack), goal: goals.carbsG, color: '#F5A524', stack: carbsStack },
  ];
  const currentMacro = macroRings.find((m) => m.key === macro) ?? macroRings[0];

  const journeyStart = plan?.startMs ?? (logs[0] ? new Date(`${logs[0].day}T12:00:00`).getTime() : Date.now());
  const journeyDeadline = journeyStart + (plan?.weeks ?? 12) * 7 * 86400000;
  const hasJourney = wantsTarget && targetWeight !== undefined && startWeight !== undefined && startWeight !== targetWeight;
  const journeyPoints =
    hasJourney && targetWeight !== undefined && startWeight !== undefined
      ? logs
          .map((l) => ({ t: new Date(`${l.day}T12:00:00`).getTime(), pct: ((startWeight - l.weightKg) / (startWeight - targetWeight)) * 100 }))
          .filter((q) => q.t >= journeyStart - 43200000)
      : [];
  const journeyBlock = hasJourney ? (
    <View style={styles.card}>
      <Text style={styles.chartTitle}>{wantsLose ? tr('O seu caminho até ao peso desejado') : tr('O seu caminho até ao objetivo')}</Text>
      <JourneyChart
        width={chartWidth}
        startMs={journeyStart}
        deadlineMs={journeyDeadline}
        points={journeyPoints}
        emptyText={tr('Registe o seu peso em Corpo para o gráfico começar a subir.')}
        goalLabel={tr('Meta')}
        deadlineLabel={tr('Prazo')}
      />
      <Text style={styles.footnote}>
        {journeyPoints.length === 0
          ? tr('O gráfico sobe quando se aproxima da meta e cai quando se afasta.')
          : weightLeft !== null && weightLeft < 0.1
            ? tr('Chegou ao peso desejado. Parabéns!')
            : tr('Faltam {kg} kg para os {target} kg.', { kg: (weightLeft ?? 0).toFixed(1).replace('.', ','), target: String(targetWeight).replace('.', ',') })}
      </Text>
    </View>
  ) : null;

  return (
    <ProGate feature={tr('Acompanhe calorias, macros e peso ao longo da semana e do mês.')}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: SCREEN_PADDING, paddingBottom: TAB_BAR_SPACE + 24, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Sparkles size={22} color="#F6BE3D" />
          <Text style={styles.title}>{tr('Estatísticas')}</Text>
        </View>
        <SegmentedControl
          options={[
            { key: 'week', label: tr('Semana') },
            { key: 'month', label: tr('Mês') },
            { key: 'year', label: tr('Ano') },
          ]}
          value={period}
          onChange={changePeriod}
        />
        <View style={styles.rangeRow}>
          <Pressable hitSlop={12} onPress={() => setOffset((o) => o - 1)} style={styles.navBtn}>
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.rangeText}>{range.title}</Text>
          <Pressable hitSlop={12} onPress={() => setOffset((o) => Math.min(0, o + 1))} style={[styles.navBtn, isCurrent && { opacity: 0.3 }]} disabled={isCurrent}>
            <ChevronRight size={20} color={colors.text} />
          </Pressable>
        </View>

        <SegmentedControl
          options={[
            { key: 'summary', label: tr('Resumo') },
            { key: 'nutrition', label: tr('Nutrição') },
            { key: 'body', label: tr('Corpo') },
          ]}
          value={section}
          onChange={setSection}
        />

        {section === 'summary' && (
          <>
        <Pressable style={styles.card} onPress={() => setReportOpen((v) => !v)}>
          <View style={styles.reportRow}>
            <View style={styles.reportIcon}>
              <Wand2 size={22} color="#7C83F2" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.reportTitle}>{tr('Relatório de IA')}</Text>
              <View style={styles.premiumChip}>
                <Lock size={11} color="#6D5BD0" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
              <Text style={styles.muted}>
                {range.title} · {loggedDays}/{totalDays} {tr('dias')}
              </Text>
            </View>
            <ChevronDown size={20} color={colors.textMuted} style={reportOpen ? { transform: [{ rotate: '180deg' }] } : undefined} />
          </View>
          {reportOpen && <Text style={styles.summaryText}>{aiSummary ?? summary}</Text>}
        </Pressable>


            {journeyBlock}

        <View style={styles.card}>
          <Text style={styles.chartTitle}>🔥 {tr('Calorias')}</Text>
          <View style={styles.bigRow}>
            <Text style={styles.big}>{avgKcal}</Text>
            <Text style={styles.unit}>{tr('kcal')}</Text>
            <Text style={styles.target}>{tr('Objetivo')}: {goals.calories} kcal</Text>
          </View>
          {chart({ stacks: kcalStack, goal: goals.calories, line: burnLine })}
          {legend}
          <Text style={styles.footnote}>{plain(avgKcal, goals.calories, 'kcal')}</Text>
          <Text style={styles.footnote}>{tr('A linha tracejada é a sua meta diária.')}</Text>
          {burnLine && (
            <View style={styles.legendItem}>
              <View style={styles.dash} />
              <Text style={styles.legendText}>{tr('Total queimado')}</Text>
            </View>
          )}
        </View>


        <StreakCard streak={streak} last7={last7} />

        <Pressable
          style={styles.shareBtn}
          onPress={() =>
            void Share.share({ message: buildWeeklyReport(meals, goals, displayName.split(' ')[0] ?? '', referral.code || undefined) }).catch(() => undefined)
          }
        >
          <Share2 size={16} color="#fff" />
          <Text style={styles.shareText}>{tr('Partilhar resumo da semana')}</Text>
        </Pressable>
          </>
        )}

        {section === 'nutrition' && (
          <>
            <View style={styles.card}>
              <Text style={styles.chartTitle}>{tr('Macros · média diária')}</Text>
              <View style={styles.ringsRow}>
                {macroRings.map((m) => (
                  <View key={m.label} style={styles.ringItem}>
                    <ProgressRing size={74} strokeWidth={8} progress={m.goal > 0 ? m.value / m.goal : 0} color={m.color}>
                      <Text style={styles.ringPct}>{pct(m.value, m.goal)}%</Text>
                    </ProgressRing>
                    <Text style={styles.ringLabel}>{tr(m.label)}</Text>
                    <Text style={styles.ringSub}>{m.value} / {m.goal} g</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {macroRings.map((m) => (
                  <Pressable key={m.key} onPress={() => setMacro(m.key)} style={[styles.chip, macro === m.key && { backgroundColor: colors.text, borderColor: colors.text }]}>
                    <Text style={[styles.chipText, macro === m.key && { color: colors.background }]}>{m.emoji} {tr(m.label)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              {chart({ stacks: currentMacro.stack, goal: currentMacro.goal })}
              {legend}
              <Text style={styles.footnote}>{plain(currentMacro.value, currentMacro.goal, 'g')}</Text>
            </View>

        <View style={styles.card}>
          <Text style={styles.chartTitle}>🧬 {tr('Nutrientes avançados')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {NUTRIENTS.map((n) => (
              <Pressable key={n.key} onPress={() => setNutrient(n.key)} style={[styles.chip, nutrient === n.key && { backgroundColor: n.color[1], borderColor: n.color[1] }]}>
                <Text style={[styles.chipText, nutrient === n.key && { color: '#fff' }]}>{tr(n.label)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {chart({ stacks: nutStack, gradient: nut.color })}
          <Text style={styles.footnote}>{tr('Média por dia com registos')} · {nut.unit}</Text>
        </View>

          </>
        )}

        {section === 'body' && (
          <>
        <View style={styles.card}>
          <Text style={styles.chartTitle}>💧 {tr('Água')}</Text>
          {chart({ stacks: waterStack, goal: goals.waterMl, gradient: ['#67D4FF', '#2F6BEA'] })}
          <Text style={styles.footnote}>{plain(Math.round(waterAvg), goals.waterMl, 'ml')}</Text>
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
                    {weightDelta.toFixed(1).replace('.', ',')} kg
                  </Text>
                )}
              </View>
              {periodLogs.length > 0 ? (
                <LineChart points={periodLogs.map((l) => ({ label: shortDate(l.day), value: l.weightKg }))} width={chartWidth} goal={targetWeight} />
              ) : (
                <Text style={styles.muted}>{tr('Sem registos de peso neste período.')}</Text>
              )}
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

            {profile?.goal === 'lose_weight' && <WeightChanges logs={logs} />}
        <Pressable style={styles.photosBtn} onPress={() => router.push('/progress-photos')}>
          <Camera size={16} color={colors.primaryDark} />
          <Text style={styles.photosText}>{tr('Fotos de progresso (antes e depois)')}</Text>
        </Pressable>

          </>
        )}
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
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ringItem: { alignItems: 'center', gap: 4 },
  ringPct: { fontSize: font.body, fontWeight: '700', color: colors.text },
  ringLabel: { fontSize: font.small, fontWeight: '600', color: colors.text },
  ringSub: { fontSize: font.tiny, color: colors.textMuted },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rangeText: { fontSize: font.h3, fontWeight: '600', color: colors.text },
  navBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  premiumChip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#EEF0FF', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  premiumText: { fontSize: 11, fontWeight: '600', color: '#6D5BD0' },
  chartTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  legendDot: { width: 9, height: 9, borderRadius: 3 },
  legendText: { fontSize: 11, color: colors.textMuted },
  dash: { width: 16, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.textMuted },
  footnote: { fontSize: font.small, color: colors.textMuted, textAlign: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipText: { fontSize: font.small, fontWeight: '600', color: colors.text },
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
