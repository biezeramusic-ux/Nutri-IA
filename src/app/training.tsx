import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bookmark, Check, ChevronLeft, ChevronRight, Trash2, Dumbbell, Flame, Footprints, HeartPulse, Home, MapPin, Mountain, RefreshCw, Sparkles, Timer, Wind, X, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import { ExerciseFigure, equipmentFor } from '../components/ExerciseFigure';
import { ScreenHeader } from '../components/ScreenHeader';
import { WorkoutSession } from '../components/WorkoutSession';
import { useActivity } from '../hooks/useActivity';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { Alert } from '../i18n/alert';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import { todayKey } from '../services/date';
import { weekDays } from '../services/dayUtils';
import { deleteActivity, listActivities, listActivityKcal } from '../services/repositories/tracker';
import type { ActivityLog } from '../types';
import { WeekStrip } from '../components/WeekStrip';
import {
  LEVELS,
  PLACES,
  generateWorkout,
  loadPrefs,
  loadSaved,
  savePrefs,
  toggleSaved,
  type Level,
  type Place,
  type TrainingPrefs,
  type WorkoutKind,
  type WorkoutPlan,
} from '../services/workout';

type Tile = { id: string; label: string; colors: [string, string]; Icon: typeof Dumbbell; kind?: WorkoutKind; run?: boolean; desc?: string; sub?: string };

const GYM_TILES: Tile[] = [
  { id: 'strength', sub: 'Músculos', label: 'Força', colors: ['#3B82F6', '#1D4ED8'], Icon: Dumbbell, kind: 'strength' },
  { id: 'hiit', sub: 'Queima mais', label: 'Cardio intenso', colors: ['#EF4444', '#B91C1C'], Icon: Flame, kind: 'hiit' },
  { id: 'pilates', sub: 'Postura e core', label: 'Pilates', colors: ['#14B8A6', '#0F766E'], Icon: Wind, kind: 'pilates' },
  { id: 'mobility', sub: 'Soltar o corpo', label: 'Mobilidade', colors: ['#22C55E', '#15803D'], Icon: HeartPulse, kind: 'mobility' },
  { id: 'stretch', sub: 'Relaxar', label: 'Alongamento', colors: ['#A855F7', '#7E22CE'], Icon: Sparkles, kind: 'stretch' },
];
const PLACE_ICON: Record<Place, typeof Home> = { home: Home, gym: Dumbbell, outdoor: Mountain, studio: MapPin };
const MINUTES = [15, 20, 30, 45, 60];

/** Treino: onde treina, dica do dia da IA, corrida e treinos personalizados (força, cardio, pilates, mobilidade). */
export default function TrainingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isPro } = useSubscription();
  const uid = user?.id ?? null;
  const goal = profile?.goal ?? null;

  const [prefs, setPrefs] = useState<TrainingPrefs | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [asking, setAsking] = useState(false);
  const [draftPlace, setDraftPlace] = useState<Place>('home');
  const [draftLevel, setDraftLevel] = useState<Level>('beginner');
  const [tab, setTab] = useState<'all' | 'saved'>('all');
  const [saved, setSaved] = useState<WorkoutPlan[]>([]);
  const [pick, setPick] = useState<Tile | null>(null);
  const [selDay, setSelDay] = useState(() => new Date());
  const [entries, setEntries] = useState<ActivityLog[]>([]);
  const [todayEntries, setTodayEntries] = useState<ActivityLog[]>([]);
  const [weekKcal, setWeekKcal] = useState<Record<string, number>>({});
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState(false);
  const { add: addActivity } = useActivity();

  useEffect(() => {
    if (!uid) return;
    void loadPrefs(uid).then((p) => {
      setPrefs(p);
      setLoaded(true);
      if (!p) setAsking(true);
    });
    void loadSaved(uid).then(setSaved);
  }, [uid]);

  const selKey = todayKey(selDay);
  const days = useMemo(() => weekDays(selDay), [selDay]);
  const weekFrom = todayKey(days[0]);
  const weekTo = todayKey(days[6]);

  // Lê o registo do dia escolhido, o de hoje e as calorias da semana (sempre que o ecrã aparece ou o dia muda).
  const reload = useCallback(async () => {
    if (!uid) return;
    try {
      const [day, today, week] = await Promise.all([listActivities(uid, selKey), listActivities(uid, todayKey()), listActivityKcal(uid, weekFrom, weekTo)]);
      setEntries(day);
      setTodayEntries(today);
      setWeekKcal(week);
    } catch {
      // sem ligação: mantém o que já estava
    }
  }, [uid, selKey, weekFrom, weekTo]);
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const confirmPrefs = async () => {
    if (!uid) return;
    const next = { place: draftPlace, level: draftLevel };
    await savePrefs(uid, next);
    setPrefs(next);
    setAsking(false);
  };

  const open = (t: Tile) => {
    setPick(t);
  };

  const create = async () => {
    if (!pick?.kind || !prefs) return;
    setBusy(true);
    const r = await generateWorkout(pick.kind, prefs, minutes, goal);
    setBusy(false);
    setPick(null);
    setPlan(r.plan);
    if (r.proOnly) Alert.alert(tr('Treino personalizado'), tr('Com o plano Pro, o treino é pensado para si. Este é um treino base.'));
  };

  const todayKcal = todayEntries.reduce((a, e) => a + e.kcal, 0);
  const todayMin = todayEntries.reduce((a, e) => a + e.minutes, 0);
  const dayKcal = entries.reduce((a, e) => a + e.kcal, 0);
  const dayMin = entries.reduce((a, e) => a + e.minutes, 0);
  const isToday = selKey === todayKey();
  const shiftWeek = (n: number) => setSelDay((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n * 7));
  const dayLabel = selDay.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const rangeLabel = `${days[0].getDate()}/${days[0].getMonth() + 1} – ${days[6].getDate()}/${days[6].getMonth() + 1}`;
  const progressByDay = Object.fromEntries(Object.entries(weekKcal).map(([k, v]) => [k, Math.min(1, v / 300)]));
  const removeEntry = (id: string) =>
    Alert.alert(tr('Apagar registo'), tr('Este registo fica apagado.'), [
      { text: tr('Cancelar'), style: 'cancel' },
      {
        text: tr('Apagar'),
        style: 'destructive',
        onPress: async () => {
          await deleteActivity(id).catch(() => undefined);
          void reload();
        },
      },
    ]);

  const isSaved = (p: WorkoutPlan) => saved.some((w) => w.id === p.id);
  const save = async (p: WorkoutPlan) => uid && setSaved(await toggleSaved(uid, p));

  const tile = (t: Tile) => (
    <Pressable key={t.id} style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.97 }] }]} onPress={() => open(t)} accessibilityRole="button">
      <LinearGradient colors={t.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.tileShine} />
      <t.Icon size={92} color="rgba(255,255,255,0.18)" strokeWidth={1.5} style={styles.tileBig} />
      <View style={styles.tileIcon}>
        <t.Icon size={22} color="#fff" strokeWidth={2.2} />
      </View>
      <View>
        <Text style={styles.tileText}>{tr(t.label)}</Text>
        {!!t.sub && <Text style={styles.tileSub}>{tr(t.sub)}</Text>}
      </View>
    </Pressable>
  );


  if (!loaded) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={tr('Treino')}
          right={
            prefs ? (
              <Pressable style={styles.placeBtn} onPress={() => { setDraftPlace(prefs.place); setDraftLevel(prefs.level); setAsking(true); }} accessibilityLabel={tr('Alterar')}>
                {(() => {
                  const I = PLACE_ICON[prefs.place];
                  return <I size={18} color={colors.primaryDark} />;
                })()}
              </Pressable>
            ) : undefined
          }
        />


        <LinearGradient colors={['#22C55E', '#15803D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.todayCard}>
          <View style={styles.todayDeco} />
          <View style={styles.todayHead}>
            <View style={styles.todayIcon}>
              <Flame size={20} color="#fff" />
            </View>
            <Text style={styles.todayTitle}>{tr('Treino de hoje')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={styles.todayBig}>{todayKcal}</Text>
            <Text style={styles.todayUnit}>{tr('kcal queimadas')}</Text>
          </View>
          <View style={styles.todayChips}>
            <View style={styles.todayChip}>
              <Timer size={14} color="#fff" />
              <Text style={styles.todayChipText}>{todayMin} min</Text>
            </View>
            <View style={styles.todayChip}>
              <Dumbbell size={14} color="#fff" />
              <Text style={styles.todayChipText}>
                {todayEntries.length} {tr(todayEntries.length === 1 ? 'treino' : 'treinos')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.historyCard}>
          <View style={styles.historyHead}>
            <Text style={styles.historyTitle}>{tr('Registo de treinos')}</Text>
            <View style={styles.weekNav}>
              <Pressable style={styles.navBtn} onPress={() => shiftWeek(-1)} accessibilityLabel={tr('Semana anterior')}>
                <ChevronLeft size={18} color={colors.text} />
              </Pressable>
              <Text style={styles.rangeText}>{rangeLabel}</Text>
              <Pressable style={styles.navBtn} onPress={() => shiftWeek(1)} accessibilityLabel={tr('Semana seguinte')}>
                <ChevronRight size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>
          <WeekStrip days={days} selectedKey={selKey} onSelect={setSelDay} progressByDay={progressByDay} />
          <View style={styles.dayHead}>
            <Text style={styles.dayLabel}>{isToday ? tr('Hoje') : dayLabel}</Text>
            <Text style={styles.daySummary}>
              {dayMin} min · {dayKcal} kcal
            </Text>
          </View>
          {!isToday && (
            <Pressable onPress={() => setSelDay(new Date())}>
              <Text style={styles.linkText}>{tr('Voltar a hoje')}</Text>
            </Pressable>
          )}
          {entries.length === 0 ? (
            <Text style={styles.muted}>{tr('Nenhum treino registado neste dia.')}</Text>
          ) : (
            entries.map((e) => (
              <View key={e.id} style={styles.entryRow}>
                <View style={styles.savedIcon}>
                  <Dumbbell size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedTitle}>{e.type}</Text>
                  <Text style={styles.muted}>
                    {e.minutes} min · {e.kcal} kcal
                  </Text>
                </View>
                <Pressable onPress={() => removeEntry(e.id)} hitSlop={10} accessibilityLabel={tr('Apagar')}>
                  <Trash2 size={16} color={colors.textFaint} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={styles.tabs}>
          {(['all', 'saved'] as const).map((t) => (
            <Pressable key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && { color: colors.text }]}>{t === 'all' ? tr('Tudo') : tr('Salvo')}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'all' ? (
          <>
            <Text style={styles.section}>{tr('Treino')}</Text>
            <View style={styles.grid}>{GYM_TILES.map(tile)}</View>
          </>
        ) : saved.length === 0 ? (
          <Text style={styles.muted}>{tr('Ainda não guardou treinos. Abra um treino e toque no marcador.')}</Text>
        ) : (
          saved.map((p) => (
            <Pressable key={p.id} style={styles.savedRow} onPress={() => setPlan(p)}>
              <View style={styles.savedIcon}>
                <Dumbbell size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.savedTitle}>{p.title}</Text>
                <Text style={styles.muted}>
                  {p.minutes} min · {p.kcal} kcal · {tr(PLACES.find((x) => x.id === p.place)?.label ?? '')}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textFaint} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Primeira vez: onde e com que nível treina */}
      <Modal visible={asking} transparent animationType="slide" onRequestClose={() => prefs && setAsking(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
            <Text style={styles.sheetTitle}>{tr('Onde costuma treinar?')}</Text>
            <Text style={styles.muted}>{tr('Assim criamos treinos que pode mesmo fazer.')}</Text>
            <View style={styles.optGrid}>
              {PLACES.map((p) => {
                const I = PLACE_ICON[p.id];
                const on = draftPlace === p.id;
                return (
                  <Pressable key={p.id} style={[styles.opt, on && styles.optOn]} onPress={() => setDraftPlace(p.id)}>
                    <I size={22} color={on ? colors.primary : colors.textMuted} />
                    <Text style={[styles.optText, on && { color: colors.primaryDark }]}>{tr(p.label)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.sheetSub}>{tr('Qual é o seu nível?')}</Text>
            {LEVELS.map((l) => {
              const on = draftLevel === l.id;
              return (
                <Pressable key={l.id} style={[styles.levelRow, on && styles.optOn]} onPress={() => setDraftLevel(l.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optText}>{tr(l.label)}</Text>
                    <Text style={styles.muted}>{tr(l.sub)}</Text>
                  </View>
                  {on && <Check size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
            <Pressable style={styles.cta} onPress={() => void confirmPrefs()}>
              <Text style={styles.ctaText}>{tr('Continuar')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Escolher a duração e criar */}
      <Modal visible={!!pick} transparent animationType="slide" onRequestClose={() => !busy && setPick(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
            <Text style={styles.sheetTitle}>{pick ? tr(pick.label) : ''}</Text>
            <Text style={styles.muted}>{isPro ? tr('Criamos o treino para si.') : tr('Com o plano Pro, o treino é pensado para si.')}</Text>
            <Text style={styles.sheetSub}>{tr('Quanto tempo tem?')}</Text>
            <View style={styles.optGrid}>
              {MINUTES.map((m) => (
                <Pressable key={m} style={[styles.minChip, minutes === m && styles.optOn]} onPress={() => setMinutes(m)}>
                  <Text style={[styles.optText, minutes === m && { color: colors.primaryDark }]}>{m} min</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.cta, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => void create()}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{tr('Criar treino')}</Text>}
            </Pressable>
            <Pressable onPress={() => !busy && setPick(null)} style={{ alignItems: 'center', padding: 8 }}>
              <Text style={styles.muted}>{tr('Cancelar')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* O treino */}
      <Modal visible={!!plan} animationType="slide" onRequestClose={() => setPlan(null)}>
        {plan && (
          <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
            <View style={styles.planHead}>
              <Pressable style={styles.close} onPress={() => setPlan(null)} accessibilityLabel={tr('Fechar')}>
                <X size={20} color={colors.text} />
              </Pressable>
              <Text style={styles.planTitle} numberOfLines={2}>
                {plan.title}
              </Text>
              <Pressable style={styles.close} onPress={() => void save(plan)} accessibilityLabel={tr('Guardar treino')}>
                <Bookmark size={20} color={isSaved(plan) ? colors.primary : colors.text} fill={isSaved(plan) ? colors.primary : 'transparent'} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 30, gap: 12 }} showsVerticalScrollIndicator={false}>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Timer size={18} color={colors.primary} />
                  <Text style={styles.statValue}>{plan.minutes} min</Text>
                </View>
                <View style={styles.stat}>
                  <Flame size={18} color="#F97316" />
                  <Text style={styles.statValue}>≈ {plan.kcal} kcal</Text>
                </View>
              </View>
              {plan.warmup.length > 0 && (
                <View style={styles.block}>
                  <Text style={styles.blockTitle}>{tr('Aquecimento')}</Text>
                  {plan.warmup.map((w, i) => (
                    <Text key={i} style={styles.line}>• {w}</Text>
                  ))}
                </View>
              )}
              {plan.exercises.map((e, i) => (
                <View key={i} style={styles.exercise}>
                  <View style={styles.figBox}>
                    <ExerciseFigure name={e.name} size={92} gym={plan.place === 'gym'} />
                    <View style={styles.numBadge}>
                      <Text style={styles.numText}>{i + 1}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={styles.exName}>{e.name}</Text>
                    <View style={styles.pills}>
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>{e.sets} {tr('séries')}</Text>
                      </View>
                      <View style={[styles.pill, styles.pillGreen]}>
                        <Text style={[styles.pillText, { color: colors.primaryDark }]}>{e.reps}</Text>
                      </View>
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>{tr('descanso')} {e.restSec}s</Text>
                      </View>
                    </View>
                    {equipmentFor(e.name, plan.place === 'gym') && (
                      <View style={styles.gearPill}>
                        <Dumbbell size={12} color={colors.primaryDark} />
                        <Text style={styles.gearText}>{tr(equipmentFor(e.name, true) ?? '')}</Text>
                      </View>
                    )}
                    {!!e.tip && <Text style={styles.exTip}>{e.tip}</Text>}
                  </View>
                </View>
              ))}
              {plan.cooldown.length > 0 && (
                <View style={styles.block}>
                  <Text style={styles.blockTitle}>{tr('Alongamento final')}</Text>
                  {plan.cooldown.map((w, i) => (
                    <Text key={i} style={styles.line}>• {w}</Text>
                  ))}
                </View>
              )}
              {!!plan.note && <Text style={styles.muted}>{plan.note}</Text>}
            </ScrollView>
            <View style={[styles.startBar, { paddingBottom: insets.bottom + 12 }]}>
              <Pressable style={styles.cta} onPress={() => setSession(true)}>
                <Text style={styles.ctaText}>{tr('Começar treino')} · {plan.minutes} min</Text>
              </Pressable>
            </View>
            <Modal visible={session} animationType="slide" onRequestClose={() => setSession(false)}>
              <WorkoutSession
                plan={plan}
                onClose={() => setSession(false)}
                onSave={async (m, k) => {
                  try {
                    await addActivity({ type: plan.title, minutes: m, kcal: k });
                    void reload();
                  } catch {
                    Alert.alert(tr('Não foi possível guardar'), tr('Verifique a ligação à internet.'));
                  }
                }}
              />
            </Modal>
          </View>
        )}
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    placeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    placeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
    placeText: { fontSize: font.small, fontWeight: '700', color: colors.primaryDark },
    placeEdit: { fontSize: font.small, fontWeight: '700', color: colors.textMuted },
    tipCard: { borderRadius: 24, padding: 16, gap: 8, backgroundColor: colors.primary },
    tipHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tipTitle: { flex: 1, color: '#fff', fontSize: font.body, fontWeight: '800' },
    tipText: { color: '#fff', fontSize: font.h3, lineHeight: 24, fontWeight: '600' },
    todayCard: { borderRadius: 26, padding: 18, gap: 10, overflow: 'hidden' },
    todayDeco: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.13)', right: -50, top: -60 },
    todayHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    todayIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
    todayTitle: { color: '#fff', fontSize: font.h3, fontWeight: '800' },
    todayBig: { color: '#fff', fontSize: 54, lineHeight: 60, fontWeight: '800', letterSpacing: -1.5 },
    todayUnit: { color: 'rgba(255,255,255,0.92)', fontSize: font.h3, fontWeight: '700' },
    todayChips: { flexDirection: 'row', gap: 8 },
    todayChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    todayChipText: { color: '#fff', fontSize: font.small, fontWeight: '800' },
    historyCard: { ...cardBase(colors), borderRadius: 24, padding: 16, gap: 12 },
    historyHead: { gap: 10 },
    historyTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    rangeText: { fontSize: font.body, fontWeight: '700', color: colors.text },
    dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    dayLabel: { fontSize: font.body, fontWeight: '800', color: colors.text, textTransform: 'capitalize' },
    daySummary: { fontSize: font.small, fontWeight: '700', color: colors.textMuted },
    linkText: { fontSize: font.small, fontWeight: '800', color: colors.primaryDark },
    entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
    kmCard: { ...cardBase(colors), flexDirection: 'row', alignItems: 'center', borderRadius: 22, paddingVertical: 14 },
    kmCol: { flex: 1, alignItems: 'center', gap: 2 },
    kmValue: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    kmLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
    kmDivider: { width: 1, height: 34, backgroundColor: colors.border },
    runInfo: { gap: 8, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14 },
    runLine: { fontSize: font.body, color: colors.text, lineHeight: 21 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
    tabOn: { borderBottomWidth: 2, borderBottomColor: colors.text },
    tabText: { fontSize: font.body, fontWeight: '700', color: colors.textMuted },
    section: { fontSize: font.small, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tile: { width: '48.2%', height: 128, borderRadius: 22, padding: 14, justifyContent: 'space-between', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
    tileShine: { position: 'absolute', top: -50, left: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.14)' },
    tileBig: { position: 'absolute', right: -14, bottom: -14 },
    tileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
    tileText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.2, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
    tileSub: { color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '600', marginTop: 2 },
    muted: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
    savedRow: { ...cardBase(colors), flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg },
    savedIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    savedTitle: { fontSize: font.body, fontWeight: '800', color: colors.text },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12 },
    sheetTitle: { fontSize: font.h1, fontWeight: '800', color: colors.text },
    sheetSub: { fontSize: font.h3, fontWeight: '800', color: colors.text, marginTop: 4 },
    optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    opt: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: 'transparent' },
    optOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    optText: { fontSize: font.body, fontWeight: '700', color: colors.text },
    levelRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: 'transparent' },
    minChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: 'transparent' },
    cta: { height: 54, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '800' },
    planHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SCREEN_PADDING, paddingBottom: 10 },
    close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    planTitle: { flex: 1, fontSize: font.h2, fontWeight: '800', color: colors.text, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
    statValue: { fontSize: font.small, fontWeight: '800', color: colors.text },
    block: { ...cardBase(colors), borderRadius: radius.lg, padding: 14, gap: 4 },
    blockTitle: { fontSize: font.body, fontWeight: '800', color: colors.text, marginBottom: 2 },
    line: { fontSize: font.body, color: colors.text, lineHeight: 22 },
    exercise: { ...cardBase(colors), flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 22 },
    figBox: { width: 92, height: 92, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    numBadge: { position: 'absolute', top: -6, left: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    startBar: { paddingHorizontal: SCREEN_PADDING, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    num: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    numText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    exName: { fontSize: font.h3, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
    exTip: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
    gearPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
    gearText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
    pillGreen: { backgroundColor: colors.primarySoft },
    pillText: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  });
