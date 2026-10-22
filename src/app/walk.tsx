import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Footprints, MapPin, Route, Timer, Trash } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import { RouteMap } from '../components/RouteMap';
import { RunLive } from '../components/RunLive';
import { RunShareCard } from '../components/RunShareCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { Alert } from '../i18n/alert';
import { useActivity } from '../hooks/useActivity';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { useWalkTracker } from '../hooks/useWalkTracker';
import { ConnectMark } from '../components/ConnectMark';
import { connectSteps, getStepsSource } from '../services/stepsConnection';
import { formatHMS } from '../hooks/useFasting';
import { deleteWalk, formatKm, formatPace, isRegistered, isRun, kcalForWalk, loadWalks, saveWalk, stepsFromDistance, thinPoints, updateWalk, type Walk } from '../services/walks';
import { todayKey } from '../services/date';
import { tr } from '../i18n';

const formatDuration = (ms: number): string => {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min ${sec}s`;
};

const dayOf = (ms: number) => todayKey(new Date(ms));
const clock = (ms: number) => `${String(new Date(ms).getHours()).padStart(2, '0')}:${String(new Date(ms).getMinutes()).padStart(2, '0')}`;
const dateLabel = (ms: number) => `${String(new Date(ms).getDate()).padStart(2, '0')}/${String(new Date(ms).getMonth() + 1).padStart(2, '0')}`;

export default function WalkScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, displayName } = useAuth();
  const { profile } = useProfile();
  const { setSteps } = useActivity();
  const tracker = useWalkTracker();
  const [walks, setWalks] = useState<Walk[]>([]);
  const [open, setOpen] = useState<Walk | null>(null);
  const [stepsOn, setStepsOn] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [here, setHere] = useState<{ lat: number; lng: number; t: number } | null>(null);
  const userId = user?.id ?? null;
  const heightCm = profile?.quiz?.heightCm ?? 165;
  const weightKg = profile?.quiz?.weightKg ?? 65;
  const mapW = width - SCREEN_PADDING * 2 - 32;

  useEffect(() => {
    void getStepsSource().then((src) => setStepsOn(src !== null));
  }, []);

  const connectSensor = async () => {
    setConnecting(true);
    const r = await connectSteps({ gps: true });
    setConnecting(false);
    if (r.status === 'ok') {
      setStepsOn(true);
      void tracker.requestPermission();
      return;
    }
    Alert.alert(
      r.status === 'denied' ? tr('Permissão necessária') : tr('Não disponível'),
      r.status === 'denied'
        ? tr('Permita o acesso à atividade física nas definições do telemóvel.')
        : r.status === 'not_installed'
          ? tr('Instale ou atualize o Google Health Connect na Play Store e tente outra vez.')
          : tr('Este telemóvel não tem sensor de passos ou está a usar o navegador.'),
      r.status === 'denied'
        ? [
            { text: tr('Cancelar'), style: 'cancel' },
            { text: tr('Abrir definições'), onPress: () => void Linking.openSettings() },
          ]
        : undefined,
    );
  };

  const { open: openParam } = useLocalSearchParams<{ open?: string }>();
  useEffect(() => {
    if (!userId) return;
    void loadWalks(userId).then((list) => {
      setWalks(list);
      const wanted = openParam ? list.find((w) => w.id === openParam) : undefined;
      if (wanted) setOpen(wanted);
    });
  }, [userId, openParam]);

  // Mapa verdadeiro com a posição atual (antes de começar a caminhar).
  useEffect(() => {
    if (!tracker.granted || tracker.active) return;
    let alive = true;
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((l) => alive && setHere({ lat: l.coords.latitude, lng: l.coords.longitude, t: l.timestamp }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [tracker.granted, tracker.active]);

  const today = dayOf(Date.now());
  const todayWalks = walks.filter((w) => dayOf(w.start) === today && isRegistered(w));
  const todayM = todayWalks.reduce((s, w) => s + w.distanceM, 0);
  const todayMs = todayWalks.reduce((s, w) => s + (w.end - w.start), 0);
  const todaySteps = todayWalks.reduce((s, w) => s + w.steps, 0);

  const finish = useCallback(async () => {
    const { startedAt, endedAt } = tracker.stop();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (!userId || tracker.distanceM < 20) {
      Alert.alert(tr('Caminhada muito curta'), tr('Caminhe um pouco mais para ficar registada.'));
      return;
    }
    const ms = endedAt - startedAt;
    const walk: Walk = {
      id: String(startedAt),
      start: startedAt,
      end: endedAt,
      distanceM: Math.round(tracker.distanceM),
      steps: stepsFromDistance(tracker.distanceM, heightCm),
      kcal: kcalForWalk(tracker.distanceM, ms, weightKg),
      points: thinPoints(tracker.points),
      registered: false,
    };
    setWalks(await saveWalk(userId, walk));
    setOpen(walk);
  }, [tracker, userId, heightCm, weightKg]);

  const startWalk = async () => {
    const ok = await tracker.start();
    if (!ok)
      Alert.alert(tr('GPS necessário para caminhar'), tr('Para medir a distância e desenhar o mapa da caminhada precisamos da sua localização. Permita-a nas definições.'), [
        { text: tr('Cancelar'), style: 'cancel' },
        { text: tr('Abrir definições'), onPress: () => void Linking.openSettings() },
      ]);
  };

  /** Regista a corrida: conta os passos e as calorias no dia. */
  const register = async (w: Walk) => {
    if (!userId) return;
    const done = { ...w, registered: true };
    setWalks(await updateWalk(userId, done));
    setSteps((s) => s + w.steps);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setOpen(done);
  };

  const remove = (w: Walk) =>
    Alert.alert(tr('Apagar caminhada'), tr('Esta caminhada fica apagada.'), [
      { text: tr('Cancelar'), style: 'cancel' },
      {
        text: tr('Apagar'),
        style: 'destructive',
        onPress: async () => {
          if (userId) setWalks(await deleteWalk(userId, w.id));
          setOpen(null);
        },
      },
    ]);

  const stat = (icon: React.ReactNode, value: string, label: string) => (
    <View style={styles.stat}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 14 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={tr('Caminhada')} />

        {stepsOn === false && !tracker.active && !open && (
          <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
            <ConnectMark size={72} />
            <Text style={styles.title}>{tr('Conectar o sensor de passos')}</Text>
            <Text style={styles.body}>{tr('Para registar a sua corrida, ligue o sensor de passos do telemóvel (obrigatório) e a localização para ver o mapa.')}</Text>
            <Pressable style={[styles.cta, connecting && { opacity: 0.6 }]} disabled={connecting} onPress={() => void connectSensor()}>
              {connecting ? <ActivityIndicator color={'#fff'} /> : <Text style={styles.ctaText}>{tr('Conectar')}</Text>}
            </Pressable>
          </View>
        )}

        {stepsOn && tracker.granted === false && !tracker.active && (
          <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
            <View style={styles.pin}>
              <MapPin size={30} color={colors.primary} />
            </View>
            <Text style={styles.title}>{tr('Ligar o GPS (opcional)')}</Text>
            <Text style={styles.body}>{tr('O GPS mostra o mapa do percurso e mede a distância. Sem ele, os passos continuam a contar. Só é usado enquanto caminha.')}</Text>
            <Pressable style={styles.cta} onPress={() => void tracker.requestPermission()}>
              <Text style={styles.ctaText}>{tr('Permitir localização')}</Text>
            </Pressable>
          </View>
        )}

        {stepsOn && !tracker.active && !open && (
          <>
            {here && (
              <View style={styles.card}>
                <Text style={styles.section}>{tr('Você está aqui')}</Text>
                <RouteMap points={[here]} width={mapW} height={190} />
                <Text style={styles.credit2}>© OpenStreetMap</Text>
              </View>
            )}
            <View style={styles.card}>
              <Text style={styles.section}>{tr('Hoje')}</Text>
              <View style={styles.statsRow}>
                {stat(<Route size={18} color={colors.primary} />, `${formatKm(todayM)} km`, tr('Distância'))}
                {stat(<Timer size={18} color={colors.primary} />, formatHMS(todayMs).slice(0, 5), tr('Tempo'))}
                {stat(<Footprints size={18} color={colors.primary} />, String(todaySteps), tr('Passos'))}
              </View>
            </View>
            <Pressable style={styles.cta} onPress={() => void startWalk()}>
              <Text style={styles.ctaText}>{tr('Iniciar caminhada')}</Text>
            </Pressable>
            <Text style={styles.hint}>{tr('Mantenha o ecrã ligado e a app aberta durante a caminhada.')}</Text>
          </>
        )}

        {tracker.active && (
          <RunLive
            points={tracker.points}
            distanceM={tracker.distanceM}
            elapsedMs={tracker.elapsedMs}
            steps={stepsFromDistance(tracker.distanceM, heightCm)}
            kcal={kcalForWalk(tracker.distanceM, tracker.elapsedMs, weightKg)}
            paused={tracker.paused}
            name={displayName ? displayName.split(' ')[0] : undefined}
            width={width - SCREEN_PADDING * 2 - 32}
            onTogglePause={tracker.togglePause}
            onFinish={() => void finish()}
          />
        )}

        {open && !tracker.active && (
          <View style={{ gap: 12 }}>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>
                {isRun(open.distanceM, open.end - open.start) ? tr('Corrida') : tr('Caminhada')} · {dateLabel(open.start)} · {clock(open.start)}
              </Text>
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>{tr('Distância')}</Text>
                <Text style={styles.heroValue}>{formatKm(open.distanceM)} km</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>{tr('Passos')}</Text>
                <Text style={styles.heroValue}>{open.steps.toLocaleString('pt-PT')}</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>{tr('Tempo')}</Text>
                <Text style={styles.heroValue}>{formatDuration(open.end - open.start)}</Text>
              </View>
              <RouteMap points={open.points} width={width - SCREEN_PADDING * 2 - 36} height={230} />
              <Text style={styles.heroFoot}>
                {tr('Ritmo')} {formatPace(open.distanceM, open.end - open.start)} min/km · {open.kcal} kcal {tr('queimadas')}
              </Text>
              <Text style={styles.credit}>© OpenStreetMap</Text>
            </View>

            <RunShareCard
              points={open.points}
              distanceM={open.distanceM}
              ms={open.end - open.start}
              title={isRun(open.distanceM, open.end - open.start) ? tr('Corrida') : tr('Caminhada')}
              width={width - SCREEN_PADDING * 2}
            />

            {!isRegistered(open) ? (
              <>
                <Pressable style={styles.cta} onPress={() => void register(open)}>
                  <Text style={styles.ctaText}>{tr('Registrar corrida')}</Text>
                </Pressable>
                <Pressable style={[styles.cta, { backgroundColor: colors.surface }]} onPress={() => setOpen(null)}>
                  <Text style={[styles.ctaText, { color: colors.text }]}>{tr('Registrar depois')}</Text>
                </Pressable>
              </>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable style={[styles.cta, { flex: 1, backgroundColor: colors.surface }]} onPress={() => setOpen(null)}>
                  <Text style={[styles.ctaText, { color: colors.text }]}>{tr('Fechar')}</Text>
                </Pressable>
                <Pressable style={styles.trash} onPress={() => remove(open)}>
                  <Trash size={18} color={colors.danger} />
                </Pressable>
              </View>
            )}
          </View>
        )}

        {!tracker.active && walks.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.section}>{tr('Caminhadas')}</Text>
            {walks.slice(0, 20).map((w) => (
              <Pressable key={w.id} style={styles.row} onPress={() => setOpen(w)}>
                <View style={styles.rowIcon}>
                  <Route size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{formatKm(w.distanceM)} km</Text>
                  <Text style={styles.hint}>
                    {dateLabel(w.start)} · {clock(w.start)} · {formatHMS(w.end - w.start).slice(0, 5)}
                  </Text>
                </View>
                {isRegistered(w) ? (
                  <Text style={styles.rowSteps}>{w.steps} {tr('passos')}</Text>
                ) : (
                  <View style={styles.pending}>
                    <Text style={styles.pendingText}>{tr('Por registar')}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    card: { ...cardBase(colors), padding: 16, gap: 10 },
    pin: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: font.h2, fontWeight: '700', color: colors.text, textAlign: 'center' },
    body: { fontSize: font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
    section: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    statsRow: { flexDirection: 'row', gap: 8 },
    stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, alignItems: 'center', gap: 3 },
    statValue: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: font.tiny, color: colors.textMuted },
    cta: { height: 54, borderRadius: radius.pill, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', paddingHorizontal: 20 },
    ctaText: { fontSize: font.h3, fontWeight: '700', color: colors.background },
    hint: { fontSize: font.small, color: colors.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
    rowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
    rowSteps: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
    hero: { backgroundColor: '#0F172A', borderRadius: 24, padding: 18, alignItems: 'center', gap: 10 },
    credit2: { fontSize: 10, color: colors.textFaint, textAlign: 'right' },
    heroTitle: { fontSize: font.small, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
    heroStat: { alignItems: 'center' },
    heroLabel: { fontSize: font.small, color: 'rgba(255,255,255,0.7)' },
    heroValue: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    heroFoot: { fontSize: font.small, color: 'rgba(255,255,255,0.75)' },
    credit: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
    pending: { backgroundColor: '#FEF3C7', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
    pendingText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
    trash: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  });
