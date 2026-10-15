import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../AppText';
import { CrownMark } from '../CrownMark';
import { Logo } from '../Logo';
import { SCREEN_PADDING, font, radius } from '../../constants/theme';
import { tr } from '../../i18n';

function loop(v: Animated.Value, duration: number, delay = 0) {
  Animated.loop(
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]),
  ).start();
}

/** Fundo vivo: bolhas grandes que flutuam e partículas que sobem, em loop. */
function AnimatedBackdrop() {
  const { width, height } = useWindowDimensions();
  const blobs = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const rises = useRef(Array.from({ length: 14 }, () => new Animated.Value(0))).current;
  const seeds = useMemo(
    () => rises.map((_, i) => ({ x: ((i * 53) % 100) / 100, size: 6 + ((i * 7) % 12), dur: 5200 + ((i * 631) % 4200), delay: (i * 420) % 3600, op: 0.18 + ((i * 13) % 20) / 100 })),
    [rises],
  );

  useEffect(() => {
    blobs.forEach((b, i) => loop(b, 5200 + i * 1400, i * 500));
    rises.forEach((r, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(seeds[i].delay),
          Animated.timing(r, { toValue: 1, duration: seeds[i].dur, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();
    });
  }, [blobs, rises, seeds]);

  const move = (v: Animated.Value, dx: number, dy: number, sc: number) => ({
    transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, sc] }) },
    ],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.circleA, move(blobs[0], -70, 90, 1.18)]} />
      <Animated.View style={[styles.circleB, move(blobs[1], 80, -70, 1.22)]} />
      <Animated.View style={[styles.circleC, move(blobs[2], -40, -110, 1.3)]} />
      {rises.map((r, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: seeds[i].x * (width - 20),
            top: height,
            width: seeds[i].size,
            height: seeds[i].size,
            borderRadius: seeds[i].size,
            backgroundColor: '#fff',
            opacity: r.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, seeds[i].op, seeds[i].op, 0] }),
            transform: [{ translateY: r.interpolate({ inputRange: [0, 1], outputRange: [0, -(height + 40)] }) }],
          }}
        />
      ))}
    </View>
  );
}

/** Ecrã final do primeiro quiz: boas-vindas com o nome, em verde para marcar o momento. */
export function WelcomeScreen({ name, female, saving, onStart }: { name: string; female: boolean; saving: boolean; onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(
      260,
      [a, b, c].map((v) => Animated.timing(v, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true })),
    ).start();
  }, [a, b, c]);

  const rise = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <AnimatedBackdrop />
      <Animated.View style={[styles.center, rise(a)]}>
        <Logo size={72} />
        <CrownMark size={18} />
      </Animated.View>
      <View style={styles.center}>
        <Animated.Text style={[styles.hello, rise(a)]}>{female ? tr('Bem-vinda') : tr('Bem-vindo')}</Animated.Text>
        <Animated.Text style={[styles.name, rise(b)]} numberOfLines={2} adjustsFontSizeToFit>
          {name}
        </Animated.Text>
        <Animated.Text style={[styles.sub, rise(c)]}>{tr('O seu plano está pronto. Vamos começar esta jornada juntos.')}</Animated.Text>
      </View>
      <Animated.View style={[{ alignSelf: 'stretch' }, rise(c)]}>
        <Pressable style={[styles.cta, saving && { opacity: 0.6 }]} disabled={saving} onPress={onStart}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{tr('Começar')}</Text>}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1F8A4C', paddingHorizontal: SCREEN_PADDING, justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  circleC: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#3FC27A', opacity: 0.3, top: '38%', left: '30%' },
  circleA: { position: 'absolute', width: 380, height: 380, borderRadius: 190, backgroundColor: '#2BA862', opacity: 0.55, top: -120, right: -140 },
  circleB: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#17703D', opacity: 0.6, bottom: -90, left: -110 },
  center: { alignItems: 'center', gap: 8 },
  hello: { fontSize: 22, fontWeight: '600', color: '#D6F5E0' },
  name: { fontSize: 44, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.5, maxWidth: 320 },
  sub: { fontSize: font.body, color: '#D6F5E0', textAlign: 'center', marginTop: 10, maxWidth: 280, lineHeight: 21 },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '600' },
});
