import * as Haptics from 'expo-haptics';
import { Footprints, MapPin, Route, Timer, Trash } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import { RouteMap } from '../components/RouteMap';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { Alert } from '../i18n/alert';
import { useActivity } from '../hooks/useActivity';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { useWalkTracker } from '../hooks/useWalkTracker';
import { formatHMS } from '../hooks/useFasting';
import { estimateKcal } from '../services/activity';
import { deleteWalk, formatKm, formatPace, loadWalks, saveWalk, stepsFromDistance, thinPoints, type Walk } from '../services/walks';
import { todayKey } from '../services/date';
import { tr } from '../i18n';

const dayOf = (ms: number) => todayKey(new Date(ms));
const clock = (ms: number) => `${String(new Date(ms).getHours()).padStart(2, '0')}:${String(new Date(ms).getMinutes()).padStart(2, '0')}`;
const dateLabel = (ms: number) => `${String(new Date(ms).getDate()).padStart(2, '0')}/${String(new Date(ms).getMonth() + 1).padStart(2, '0')}`;

export default function WalkScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { setSteps, add } = useActivity();
  const tracker = useWalkTracker();
  const [walks, setWalks] = useState<Walk[]>([]);
  const [open, setOpen] = useState<Walk | null>(null);
  const userId = user?.id ?? null;
  const heightCm = profile?.quiz?.heightCm ?? 165;
  const weightKg = profile?.quiz?.weightKg ?? 65;
  const mapW = width - SCREEN_PADDING * 2 - 32;

  useEffect(() => {
    if (userId) void loadWalks(userId).then(setWalks);
  }, [userId]);

  const today = dayOf(Date.now());
  const todayWalks = walks.filter((w) => dayOf(w.start) === today);
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
    const minutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));
    const steps = stepsFromDistance(tracker.distanceM, heightCm);
    const walk: Walk = {
      id: String(startedAt),
      start: startedAt,
      end: endedAt,
      distanceM: Math.round(tracker.distanceM),
      steps,
      kcal: estimateKcal(3.5, weightKg, minutes),
      points: thinPoints(tracker.points),
    };
    setWalks(await saveWalk(userId, walk));
    setSteps((s) => s + steps);
    void add({ type: 'Caminhada', minutes, kcal: walk.kcal }).catch(() => undefined);
    setOpen(walk);
  }, [tracker, userId, heightCm, weightKg, setSteps, add]);

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

        {tracker.granted === false && !tracker.active && (
          <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
            <View style={styles.pin}>
              <MapPin size={30} color={colors.primary} />
            </View>
            <Text style={styles.title}>{tr('Conectar a localização')}</Text>
            <Text style={styles.body}>{tr('Para desenhar a rota, contar os km e o tempo da sua caminhada, o Nutri IA precisa da sua localização. Só é usada enquanto caminha.')}</Text>
            <Pressable style={styles.cta} onPress={() => void tracker.requestPermission()}>
              <Text style={styles.ctaText}>{tr('Permitir localização')}</Text>
            </Pressable>
          </View>
        )}

        {tracker.granted && !tracker.active && !open && (
          <>
            <View style={styles.card}>
              <Text style={styles.section}>{tr('Hoje')}</Text>
              <View style={styles.statsRow}>
                {stat(<Route size={18} color={colors.primary} />, `${formatKm(todayM)} km`, tr('Distância'))}
                {stat(<Timer size={18} color={colors.primary} />, formatHMS(todayMs).slice(0, 5), tr('Tempo'))}
                {stat(<Footprints size={18} color={colors.primary} />, String(todaySteps), tr('Passos'))}
              </View>
            </View>
            <Pressable style={styles.cta} onPress={() => void tracker.start()}>
              <Text style={styles.ctaText}>{tr('Iniciar caminhada')}</Text>
            </Pressable>
            <Text style={styles.hint}>{tr('Mantenha o ecrã ligado e a app aberta durante a caminhada.')}</Text>
          </>
        )}

        {tracker.active && (
          <View style={[styles.card, { gap: 14 }]}>
            <RouteMap points={tracker.points} width={mapW} />
            <View style={styles.statsRow}>
              {stat(<Route size={18} color={colors.primary} />, `${formatKm(tracker.distanceM)} km`, tr('Distância'))}
              {stat(<Timer size={18} color={colors.primary} />, formatHMS(tracker.elapsedMs), tr('Tempo'))}
              {stat(<Footprints size={18} color={colors.primary} />, String(stepsFromDistance(tracker.distanceM, heightCm)), tr('Passos'))}
            </View>
            <Pressable style={[styles.cta, { backgroundColor: colors.danger }]} onPress={() => void finish()}>
              <Text style={[styles.ctaText, { color: '#fff' }]}>{tr('Terminar caminhada')}</Text>
            </Pressable>
          </View>
        )}

        {open && !tracker.active && (
          <View style={[styles.card, { gap: 14 }]}>
            <Text style={styles.section}>
              {dateLabel(open.start)} · {clock(open.start)} → {clock(open.end)}
            </Text>
            <RouteMap points={open.points} width={mapW} />
            <View style={styles.statsRow}>
              {stat(<Route size={18} color={colors.primary} />, `${formatKm(open.distanceM)} km`, tr('Distância'))}
              {stat(<Timer size={18} color={colors.primary} />, formatHMS(open.end - open.start).slice(0, 5), tr('Tempo'))}
              {stat(<Footprints size={18} color={colors.primary} />, String(open.steps), tr('Passos'))}
            </View>
            <Text style={styles.hint}>
              {tr('Ritmo')} {formatPace(open.distanceM, open.end - open.start)} min/km · {open.kcal} kcal
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={[styles.cta, { flex: 1, backgroundColor: colors.surface }]} onPress={() => setOpen(null)}>
                <Text style={[styles.ctaText, { color: colors.text }]}>{tr('Fechar')}</Text>
              </Pressable>
              <Pressable style={styles.trash} onPress={() => remove(open)}>
                <Trash size={18} color={colors.danger} />
              </Pressable>
            </View>
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
                <Text style={styles.rowSteps}>{w.steps} {tr('passos')}</Text>
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
    trash: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  });
