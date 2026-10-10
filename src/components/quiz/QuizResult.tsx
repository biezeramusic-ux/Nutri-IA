import { Droplets } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../AppText';
import { GOAL_LABEL } from '../../constants/labels';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';
import { GLASS_ML, glassesFromMl } from '../../services/goals';
import type { DailyGoals, QuizAnswers } from '../../types';
import { Logo } from '../Logo';

interface Props {
  answers: QuizAnswers;
  goals: DailyGoals;
  tips: string[];
  firstName: string;
  saving: boolean;
  onStart: () => void;
  onBack: () => void;
}

const native = Platform.OS !== 'web';
const CALC_MS = 3200;
const PHRASES = ['A analisar o seu perfil…', 'A calcular as suas calorias…', 'A ajustar ao seu objetivo…', 'A preparar o seu plano…'];
const CONFETTI = ['🎉', '✨', '🥗', '💧', '🍎', '⭐', '🥑', '🍲', '💪', '🌟', '🥕', '🎊'];

/** Número que sobe de 0 até ao valor final. */
function CountUp({ to, delay = 0, style, suffix = '' }: { to: number; delay?: number; style: object; suffix?: string }) {
  const v = useRef(new Animated.Value(0)).current;
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setN(Math.round(value)));
    Animated.timing(v, { toValue: to, duration: 1400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [to, delay, v]);
  return (
    <Text style={style}>
      {n}
      {suffix}
    </Text>
  );
}

/** Aparece de baixo para cima, em sequência. */
function Rise({ delay, children }: { delay: number; children: React.ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.back(1.2)), useNativeDriver: native }).start();
  }, [a, delay]);
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }, { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }}>
      {children}
    </Animated.View>
  );
}

function ConfettiPiece({ index, width, height }: { index: number; width: number; height: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const left = useMemo(() => ((index * 79) % 100) / 100 * (width - 24), [index, width]);
  const dur = 4200 + (index % 5) * 700;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(fall, { toValue: 1, duration: dur, delay: (index % 6) * 350, easing: Easing.linear, useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, [fall, dur, index]);
  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -30,
        left,
        fontSize: 18 + (index % 3) * 4,
        opacity: fall.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.55, 0.55, 0] }),
        transform: [
          { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
          { translateX: fall.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 ? 18 : -18, 0] }) },
          { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', index % 2 ? '300deg' : '-300deg'] }) },
        ],
      }}
    >
      {CONFETTI[index % CONFETTI.length]}
    </Animated.Text>
  );
}

/** Fase 1: "a calcular" (logótipo a pulsar, barra e frases). */
function Calculating({ colors, onDone }: { colors: ThemeColors; onDone: () => void }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const [phrase, setPhrase] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
    );
    const s = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: native }));
    p.start();
    s.start();
    Animated.timing(bar, { toValue: 1, duration: CALC_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    const ids = PHRASES.map((_, i) =>
      setTimeout(() => {
        Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: native }).start(() => {
          setPhrase(i);
          Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: native }).start();
        });
      }, i * (CALC_MS / PHRASES.length)),
    );
    const done = setTimeout(onDone, CALC_MS + 350);
    return () => {
      p.stop();
      s.stop();
      ids.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [pulse, spin, bar, fade, onDone]);

  return (
    <View style={styles.calcRoot}>
      <View style={styles.logoStage}>
        <Animated.View style={[styles.ring, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />
        <Animated.View style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] }) }] }}>
          <View style={styles.logoBubble}>
            <Logo size={64} />
          </View>
        </Animated.View>
      </View>
      <Animated.View style={{ opacity: fade }}>
        <Text style={styles.phrase}>{PHRASES[phrase]}</Text>
      </Animated.View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </View>
  );
}

export function QuizResult({ answers, goals, tips, firstName, saving, onStart, onBack }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [phase, setPhase] = useState<'calc' | 'welcome'>('calc');
  const cta = useRef(new Animated.Value(0)).current;
  const finishCalc = useCallback(() => setPhase('welcome'), []);

  useEffect(() => {
    if (phase !== 'welcome') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cta, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(cta, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
    );
    const t = setTimeout(() => loop.start(), 2600);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [phase, cta]);

  const wantsTarget = answers.goal === 'lose_weight' || answers.goal === 'gain_muscle';
  const goalText =
    answers.goal === 'lose_weight'
      ? tr('Perder peso até {kg} kg', { kg: answers.targetWeightKg })
      : answers.goal === 'gain_muscle'
        ? tr('Ganhar massa muscular')
        : tr(GOAL_LABEL[answers.goal]);

  if (phase === 'calc') return <Calculating colors={colors} onDone={finishCalc} />;

  return (
    <View style={styles.welcomeRoot}>
      {Array.from({ length: 10 }, (_, i) => (
        <ConfettiPiece key={i} index={i} width={width} height={height} />
      ))}
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 20, paddingBottom: insets.bottom + 28, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <Rise delay={0}>
          <View style={styles.hello}>
            <Text style={styles.party}>🎉</Text>
            <Text style={styles.welcome}>{firstName ? tr('Bem-vindo ao Nutri IA, {name}!', { name: firstName }) : tr('Bem-vindo ao Nutri IA!')}</Text>
            <Text style={styles.welcomeSub}>{tr('O seu plano está pronto. Estes são os seus objetivos:')}</Text>
          </View>
        </Rise>

        <Rise delay={350}>
          <View style={styles.goalChip}>
            <Text style={styles.goalChipLabel}>{tr('O seu objetivo')}</Text>
            <Text style={styles.goalChipText}>{goalText}</Text>
          </View>
        </Rise>

        <Rise delay={650}>
          <View style={styles.kcalCard}>
            <Text style={styles.kcalLabel}>{tr(wantsTarget ? 'Meta diária' : 'Calorias de referência')}</Text>
            <CountUp to={goals.calories} delay={700} style={styles.kcalValue} />
            <Text style={styles.kcalLabel}>{tr('calorias por dia')} 🔥</Text>
          </View>
        </Rise>

        <View style={styles.macroRow}>
          {[
            { label: 'Proteína', value: goals.proteinG, color: colors.primary, emoji: '💪', delay: 950 },
            { label: 'Carbs', value: goals.carbsG, color: colors.carbs, emoji: '🌾', delay: 1100 },
            { label: 'Gordura', value: goals.fatsG, color: colors.protein, emoji: '🥑', delay: 1250 },
          ].map((m) => (
            <View key={m.label} style={{ flex: 1 }}>
              <Rise delay={m.delay}>
                <View style={styles.macroCard}>
                  <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                  <CountUp to={m.value} delay={m.delay + 100} suffix=" g" style={styles.macroValue} />
                  <Text style={styles.macroLabel}>{tr(m.label)}</Text>
                  <View style={[styles.macroBar, { backgroundColor: m.color }]} />
                </View>
              </Rise>
            </View>
          ))}
        </View>

        <Rise delay={1450}>
          <View style={styles.waterCard}>
            <Droplets size={24} color={colors.water} />
            <View style={{ flex: 1 }}>
              <Text style={styles.waterTitle}>{tr('{ml} ml de água por dia', { ml: goals.waterMl })}</Text>
              <Text style={styles.waterSub}>{tr('{n} copos de {ml} ml. O Nutri IA vai lembrá-lo de beber.', { n: glassesFromMl(goals.waterMl), ml: GLASS_ML })}</Text>
            </View>
          </View>
        </Rise>

        {tips.length > 0 && (
          <Rise delay={1650}>
            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>{tr('Para si')} ✨</Text>
              {tips.map((t) => (
                <Text key={t} style={styles.tip}>
                  • {t}
                </Text>
              ))}
            </View>
          </Rise>
        )}

        <Rise delay={1900}>
          <View style={styles.askBox}>
            <Text style={styles.ask}>{tr('Quer embarcar connosco nesta nova jornada?')} 🚀</Text>
            <Animated.View style={{ transform: [{ scale: cta.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }] }}>
              <Pressable disabled={saving} onPress={onStart} style={({ pressed }) => [styles.okBtn, (pressed || saving) && { opacity: 0.85 }]}>
                <Text style={styles.okText}>{saving ? '…' : tr('Sim, vamos! 🚀')}</Text>
              </Pressable>
            </Animated.View>
            <Pressable onPress={onBack} disabled={saving} hitSlop={10}>
              <Text style={styles.back}>{tr('Voltar e ajustar')}</Text>
            </Pressable>
          </View>
        </Rise>
      </ScrollView>
    </View>
  );
}

const WHITE_SOFT = 'rgba(255,255,255,0.1)';
const WHITE_LINE = 'rgba(255,255,255,0.18)';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    calcRoot: { flex: 1, backgroundColor: colors.hero, alignItems: 'center', justifyContent: 'center', gap: 26, paddingHorizontal: 32 },
    logoStage: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 4, borderColor: 'rgba(255,255,255,0.15)', borderTopColor: colors.primary, borderRightColor: colors.lime },
    logoBubble: { width: 108, height: 108, borderRadius: 54, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    phrase: { color: '#fff', fontSize: font.h3, fontWeight: '600', textAlign: 'center', minHeight: 22 },
    barTrack: { width: '70%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
    welcomeRoot: { flex: 1, backgroundColor: colors.hero, overflow: 'hidden' },
    hello: { alignItems: 'center', gap: 6 },
    party: { fontSize: 54 },
    welcome: { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4 },
    welcomeSub: { color: 'rgba(255,255,255,0.75)', fontSize: font.body, textAlign: 'center' },
    goalChip: { backgroundColor: WHITE_SOFT, borderWidth: 1, borderColor: WHITE_LINE, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', gap: 2 },
    goalChipLabel: { color: 'rgba(255,255,255,0.65)', fontSize: font.tiny, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    goalChipText: { color: '#fff', fontSize: font.h3, fontWeight: '700', textAlign: 'center' },
    kcalCard: { backgroundColor: colors.lime, borderRadius: radius.card, paddingVertical: 20, alignItems: 'center' },
    kcalLabel: { fontSize: font.small, fontWeight: '700', color: '#1A1A1A' },
    kcalValue: { fontSize: 54, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1.5 },
    macroRow: { flexDirection: 'row', gap: 10 },
    macroCard: { backgroundColor: WHITE_SOFT, borderWidth: 1, borderColor: WHITE_LINE, borderRadius: radius.lg, paddingVertical: 12, alignItems: 'center', gap: 2 },
    macroValue: { color: '#fff', fontSize: font.h2, fontWeight: '800' },
    macroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: font.small },
    macroBar: { width: 28, height: 4, borderRadius: 2, marginTop: 6 },
    waterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE_SOFT, borderWidth: 1, borderColor: WHITE_LINE, borderRadius: radius.lg, padding: 14 },
    waterTitle: { color: '#fff', fontSize: font.body, fontWeight: '700' },
    waterSub: { color: 'rgba(255,255,255,0.7)', fontSize: font.small, marginTop: 2, lineHeight: 17 },
    tips: { backgroundColor: WHITE_SOFT, borderWidth: 1, borderColor: WHITE_LINE, borderRadius: radius.lg, padding: 14, gap: 6 },
    tipsTitle: { color: '#fff', fontSize: font.body, fontWeight: '700' },
    tip: { color: 'rgba(255,255,255,0.8)', fontSize: font.small, lineHeight: 18 },
    askBox: { alignItems: 'center', gap: 14, marginTop: 6 },
    ask: { color: '#fff', fontSize: font.h2, fontWeight: '800', textAlign: 'center', lineHeight: 26 },
    okBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 56, paddingHorizontal: 44, alignItems: 'center', justifyContent: 'center', minWidth: 240 },
    okText: { color: '#fff', fontSize: font.h2, fontWeight: '800' },
    back: { color: 'rgba(255,255,255,0.7)', fontSize: font.body, fontWeight: '600', textDecorationLine: 'underline' },
  });
