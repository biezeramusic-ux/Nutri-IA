import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { ProgressRing } from './ProgressRing';
import { MEDAL_TIERS, StreakMedal } from './StreakMedal';
import { font, radius } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useDiary } from '../hooks/useDiary';
import { todayKey } from '../services/date';
import { STREAK_MILESTONES, computeStreak } from '../services/streak';
import { tr } from '../i18n';

const key = (userId: string) => `nutria.streakCelebrated.${userId}`;
const CONFETTI = ['#F6BE3D', '#3DBE8B', '#7C83F2', '#FF8A6B', '#4C9AFF', '#F472B6'];

/** Ecrã animado ao registar a primeira refeição do dia: mostra a sequência a subir e, nas conquistas, a medalha. */
export function StreakCelebration() {
  const { user } = useAuth();
  const { meals } = useDiary();
  const userId = user?.id ?? null;
  const streak = useMemo(() => computeStreak(meals), [meals]);
  const [show, setShow] = useState<{ count: number } | null>(null);
  const checking = useRef(false);

  useEffect(() => {
    if (!userId || !streak.today || streak.current < 1 || checking.current) return;
    checking.current = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(key(userId));
        const last = raw ? (JSON.parse(raw) as { day: string; count: number }) : null;
        if (last?.day === todayKey()) return;
        await AsyncStorage.setItem(key(userId), JSON.stringify({ day: todayKey(), count: streak.current }));
        setShow({ count: streak.current });
      } catch {
        // sem celebração se o armazenamento falhar
      } finally {
        checking.current = false;
      }
    })();
  }, [userId, streak.today, streak.current]);

  if (!show) return null;
  return <CelebrationModal count={show.count} onClose={() => setShow(null)} />;
}

function CelebrationModal({ count, onClose }: { count: number; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const milestoneIdx = STREAK_MILESTONES.indexOf(count as (typeof STREAK_MILESTONES)[number]);
  const isMilestone = milestoneIdx >= 0;
  const reachedIdx = STREAK_MILESTONES.reduce((acc, m, i) => (count >= m ? i : acc), -1);
  const tier = reachedIdx >= 0 ? MEDAL_TIERS[reachedIdx] : null;
  const next = STREAK_MILESTONES.find((m) => m > count) ?? null;
  const prev = Math.max(0, count - 1);

  const appear = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const textIn = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(prev);
  const [fill, setFill] = useState(next ? prev / next : 1);
  const confetti = useRef(Array.from({ length: 26 }, () => new Animated.Value(0))).current;
  const seeds = useMemo(
    () => confetti.map((_, i) => ({ x: ((i * 37) % 100) / 100, size: 7 + ((i * 5) % 7), dur: 2600 + ((i * 313) % 1800), delay: (i * 90) % 900, rot: 180 + ((i * 53) % 360), color: CONFETTI[i % CONFETTI.length] })),
    [confetti],
  );

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    const idRing = ring.addListener(({ value }) => {
      setShown(Math.round(prev + (count - prev) * value));
      setFill((prev + (count - prev) * value) / (next ?? count));
    });
    Animated.sequence([
      Animated.timing(appear, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
      Animated.timing(textIn, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
    if (isMilestone) {
      confetti.forEach((c, i) =>
        Animated.sequence([
          Animated.delay(1300 + seeds[i].delay),
          Animated.timing(c, { toValue: 1, duration: seeds[i].dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]).start(),
      );
    }
    return () => ring.removeListener(idRing);
  }, [appear, ring, pop, textIn, confetti, seeds, isMilestone, count, prev, next]);

  const medalTitle = tier && isMilestone ? tr('Conquistou a {medal}!', { medal: tr(tier.name).toLowerCase() }) : tr('{n} dias seguidos!', { n: count });
  const sub = isMilestone
    ? next
      ? tr('Próxima conquista: {n} dias', { n: next })
      : tr('Conquista máxima alcançada. Parabéns!')
    : next
      ? tr('Faltam {n} dias para a próxima conquista.', { n: next - count })
      : tr('Continue assim.');

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: appear, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        {isMilestone &&
          seeds.map((s, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: s.x * (width - 12),
                top: -20,
                width: s.size,
                height: s.size * 1.6,
                backgroundColor: s.color,
                borderRadius: 2,
                opacity: confetti[i].interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateY: confetti[i].interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
                  { rotate: confetti[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${s.rot}deg`] }) },
                ],
              }}
            />
          ))}

        <View style={styles.center}>
          <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}>
            <ProgressRing size={190} strokeWidth={12} progress={fill} color={tier ? tier.dark : '#FFFFFF'} trackColor="rgba(255,255,255,0.18)">
              {tier && isMilestone ? (
                <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.12] }) }] }}>
                  <StreakMedal size={128} tier={tier} value={count} />
                </Animated.View>
              ) : (
                <Text style={styles.bigNumber}>{shown}</Text>
              )}
            </ProgressRing>
          </Animated.View>

          <Animated.View style={{ alignItems: 'center', gap: 8, opacity: textIn, transform: [{ translateY: textIn.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <Text style={styles.title}>{medalTitle}</Text>
            <Text style={styles.sub}>{sub}</Text>
          </Animated.View>
        </View>

        <Animated.View style={{ alignSelf: 'stretch', opacity: textIn }}>
          <Pressable style={styles.cta} onPress={onClose}>
            <Text style={styles.ctaText}>{tr('Continuar')}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(8,12,20,0.97)', paddingHorizontal: 24, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  bigNumber: { fontSize: 76, fontWeight: '800', color: '#fff', letterSpacing: -2 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: { fontSize: font.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#0F172A', fontSize: font.h3, fontWeight: '700' },
});
