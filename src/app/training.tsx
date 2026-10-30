import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bookmark, Check, ChevronRight, Dumbbell, Flame, Footprints, HeartPulse, Home, MapPin, Mountain, RefreshCw, Sparkles, Timer, Wind, X, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { Alert } from '../i18n/alert';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import {
  LEVELS,
  PLACES,
  fallbackTip,
  generateWorkout,
  getTrainingTip,
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

type Tile = { id: string; label: string; colors: [string, string]; Icon: typeof Dumbbell; kind?: WorkoutKind; run?: boolean };

const RUN_TILES: Tile[] = [
  { id: 'easy', label: 'Corrida leve', colors: ['#84CC16', '#16A34A'], Icon: Footprints, run: true },
  { id: 'pace', label: 'Corrida de ritmo', colors: ['#F59E0B', '#EA580C'], Icon: Timer, run: true },
  { id: 'interval', label: 'Intervalos', colors: ['#F97316', '#DC2626'], Icon: Zap, run: true },
  { id: 'hill', label: 'Corrida em subida', colors: ['#4D7C0F', '#166534'], Icon: Mountain, run: true },
];
const GYM_TILES: Tile[] = [
  { id: 'strength', label: 'Força', colors: ['#3B82F6', '#1D4ED8'], Icon: Dumbbell, kind: 'strength' },
  { id: 'hiit', label: 'Cardio intenso', colors: ['#EF4444', '#B91C1C'], Icon: Flame, kind: 'hiit' },
  { id: 'pilates', label: 'Pilates', colors: ['#14B8A6', '#0F766E'], Icon: Wind, kind: 'pilates' },
  { id: 'mobility', label: 'Mobilidade', colors: ['#22C55E', '#15803D'], Icon: HeartPulse, kind: 'mobility' },
  { id: 'stretch', label: 'Alongamento', colors: ['#A855F7', '#7E22CE'], Icon: Sparkles, kind: 'stretch' },
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
  const [tip, setTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [pick, setPick] = useState<Tile | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    if (!uid) return;
    void loadPrefs(uid).then((p) => {
      setPrefs(p);
      setLoaded(true);
      if (!p) setAsking(true);
    });
    void loadSaved(uid).then(setSaved);
  }, [uid]);

  const refreshTip = useCallback(
    async (force = false) => {
      if (!prefs) return;
      setTipLoading(true);
      const t = await getTrainingTip(goal, prefs, { kcalGoal: profile?.goals?.calories }, force);
      setTip(t ?? fallbackTip(goal));
      setTipLoading(false);
    },
    [prefs, goal, profile?.goals?.calories],
  );
  useEffect(() => {
    void refreshTip(false);
  }, [refreshTip]);

  const confirmPrefs = async () => {
    if (!uid) return;
    const next = { place: draftPlace, level: draftLevel };
    await savePrefs(uid, next);
    setPrefs(next);
    setAsking(false);
  };

  const open = (t: Tile) => {
    if (t.run) {
      router.push('/walk');
      return;
    }
    setPick(t);
  };

  const create = async () => {
    if (!pick?.kind || !prefs) return;
    setBusy(true);
    const r = await generateWorkout(pick.kind, prefs, minutes, goal);
    setBusy(false);
    setPick(null);
    setPlan(r.plan);
    if (r.proOnly) Alert.alert(tr('Treino personalizado com IA'), tr('Com o plano Pro a IA cria o treino pensado para si. Este é um treino base.'));
  };

  const isSaved = (p: WorkoutPlan) => saved.some((w) => w.id === p.id);
  const save = async (p: WorkoutPlan) => uid && setSaved(await toggleSaved(uid, p));

  const tile = (t: Tile) => (
    <Pressable key={t.id} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]} onPress={() => open(t)}>
      <LinearGradient colors={t.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <t.Icon size={64} color="rgba(255,255,255,0.22)" style={styles.tileBig} />
      <t.Icon size={20} color="#fff" />
      <Text style={styles.tileText}>{tr(t.label)}</Text>
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
        <ScreenHeader title={tr('Treino')} />

        {prefs && (
          <Pressable style={styles.placeChip} onPress={() => { setDraftPlace(prefs.place); setDraftLevel(prefs.level); setAsking(true); }}>
            {(() => {
              const I = PLACE_ICON[prefs.place];
              return <I size={16} color={colors.primaryDark} />;
            })()}
            <Text style={styles.placeText}>
              {tr(PLACES.find((p) => p.id === prefs.place)?.label ?? '')} · {tr(LEVELS.find((l) => l.id === prefs.level)?.label ?? '')}
            </Text>
            <Text style={styles.placeEdit}>{tr('Alterar')}</Text>
          </Pressable>
        )}

        <View style={styles.tipCard}>
          <View style={styles.tipHead}>
            <Sparkles size={18} color="#fff" />
            <Text style={styles.tipTitle}>{tr('Dica de treino de hoje')}</Text>
            <Pressable onPress={() => void refreshTip(true)} hitSlop={10} accessibilityLabel={tr('Nova dica')}>
              {tipLoading ? <ActivityIndicator color="#fff" size="small" /> : <RefreshCw size={16} color="#fff" />}
            </Pressable>
          </View>
          <Text style={styles.tipText}>{tip ?? '…'}</Text>
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
            <Text style={styles.section}>{tr('Corrida')}</Text>
            <View style={styles.grid}>{RUN_TILES.map(tile)}</View>
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
            <Text style={styles.muted}>{isPro ? tr('A IA cria o treino para si.') : tr('Com o plano Pro a IA cria o treino pensado para si.')}</Text>
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
                {plan.ai && (
                  <View style={styles.stat}>
                    <Sparkles size={18} color="#8B5CF6" />
                    <Text style={styles.statValue}>IA</Text>
                  </View>
                )}
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
                  <View style={styles.num}>
                    <Text style={styles.numText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.exName}>{e.name}</Text>
                    <Text style={styles.exMeta}>
                      {e.sets} × {e.reps} · {tr('descanso')} {e.restSec}s
                    </Text>
                    {!!e.tip && <Text style={styles.muted}>{e.tip}</Text>}
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
          </View>
        )}
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    placeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
    placeText: { fontSize: font.small, fontWeight: '700', color: colors.primaryDark },
    placeEdit: { fontSize: font.small, fontWeight: '700', color: colors.textMuted },
    tipCard: { borderRadius: 24, padding: 16, gap: 8, backgroundColor: colors.primary },
    tipHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tipTitle: { flex: 1, color: '#fff', fontSize: font.body, fontWeight: '800' },
    tipText: { color: '#fff', fontSize: font.h3, lineHeight: 24, fontWeight: '600' },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
    tabOn: { borderBottomWidth: 2, borderBottomColor: colors.text },
    tabText: { fontSize: font.body, fontWeight: '700', color: colors.textMuted },
    section: { fontSize: font.small, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tile: { width: '30.6%', aspectRatio: 1, borderRadius: 16, padding: 10, justifyContent: 'space-between', overflow: 'hidden' },
    tileBig: { position: 'absolute', right: -8, bottom: -8 },
    tileText: { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 16 },
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
    exercise: { ...cardBase(colors), flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg },
    num: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    numText: { color: '#fff', fontWeight: '800' },
    exName: { fontSize: font.body, fontWeight: '800', color: colors.text },
    exMeta: { fontSize: font.small, fontWeight: '700', color: colors.primaryDark },
  });
