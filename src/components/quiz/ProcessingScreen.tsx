import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../AppText';
import { SCREEN_PADDING, cardBase, font, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';

const ITEMS = ['Calorias', 'Carboidratos', 'Proteína', 'Gorduras', 'Pontuação de saúde'];
const STATUS = ['A calcular as suas calorias…', 'A equilibrar os macros…', 'A personalizar o seu plano…', 'A finalizar resultados…'];
const DURATION = 9500;

/** "Estamos a configurar tudo para si": percentagem a subir, barra e a lista de itens a ficarem prontos, um a um. */
export function ProcessingScreen({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [pct, setPct] = useState(0);
  const pops = useRef(ITEMS.map(() => new Animated.Value(0))).current;
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - t0) / DURATION);
      setPct(Math.round(100 * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        setTimeout(onDone, 500);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  useEffect(() => {
    ITEMS.forEach((_, i) =>
      Animated.sequence([
        Animated.delay(2400 + i * 1500),
        Animated.spring(pops[i], { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]).start(),
    );
  }, [pops]);

  const status = STATUS[Math.min(STATUS.length - 1, Math.floor((pct / 100) * STATUS.length))];
  const BAR_W = 300;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 20 }]}>
      <Text style={styles.pct}>{pct}%</Text>
      <Text style={styles.title}>{tr('Estamos a configurar tudo para si')}</Text>

      <View style={styles.barWrap}>
        <View style={styles.barTrack}>
          <Svg width="100%" height={8} viewBox={`0 0 ${BAR_W} 8`} preserveAspectRatio="none" style={{ width: `${Math.max(2, pct)}%` }}>
            <Defs>
              <LinearGradient id="proc" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#4CAF50" />
                <Stop offset="1" stopColor="#A3E635" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={BAR_W} height="8" rx="4" fill="url(#proc)" />
          </Svg>
        </View>
        <Text style={styles.status}>{tr(status)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{tr('Recomendação diária para')}</Text>
        {ITEMS.map((label, i) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowText}>• {tr(label)}</Text>
            <ActivityIndicator size="small" color={colors.primary} style={styles.spin} />
            <Animated.View style={[styles.check, { transform: [{ scale: pops[i] }], opacity: pops[i] }]}>
              <Check size={15} color="#fff" strokeWidth={3.5} />
            </Animated.View>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.primarySoft, paddingHorizontal: SCREEN_PADDING, alignItems: 'center', gap: 16 },
    pct: { fontSize: 76, fontWeight: '800', color: colors.primary, letterSpacing: -2 },
    title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', lineHeight: 32, paddingHorizontal: 20 },
    barWrap: { alignSelf: 'stretch', gap: 12, alignItems: 'center', marginTop: 8 },
    barTrack: { alignSelf: 'stretch', height: 8, borderRadius: 4, backgroundColor: colors.card, overflow: 'hidden' },
    status: { fontSize: font.body, color: colors.textMuted },
    card: { ...cardBase(colors), alignSelf: 'stretch', padding: 20, gap: 14, marginTop: 28, borderRadius: 24 },
    cardTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowText: { fontSize: font.body, color: colors.text },
    spin: { position: 'absolute', right: 3 },
    check: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  });
