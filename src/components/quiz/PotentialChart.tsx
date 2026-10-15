import { Trophy } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from '../AppText';
import { font, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';

const W = 300;
const H = 170;
const PAD = 14;
const DURATION = 2600;

// y de 0 (início) a 1 (objetivo). Com o Nutri IA: arranca devagar e depois acelera. Sem a app: lento e instável.
const withApp = (t: number) => 0.1 + 0.88 * (1 / (1 + Math.exp(-7.5 * (t - 0.5))) - 0.023) / 0.954;
const without = (t: number) => 0.1 + 0.26 * t + 0.045 * Math.sin(11 * t);

const X = (t: number) => PAD + t * (W - PAD * 2 - 8);
const Y = (v: number) => H - 26 - v * (H - 26 - PAD - 8);
const CHECKPOINTS = [0, 0.12, 0.4, 1];

function pathUpTo(fn: (t: number) => number, p: number): string {
  const n = Math.max(2, Math.round(p * 60));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * p;
    d += `${i === 0 ? 'M' : 'L'}${X(t).toFixed(1)},${Y(fn(t)).toFixed(1)} `;
  }
  return d;
}

/** Gráfico animado: a linha e os pontos saem do início e avançam até ao objetivo (com a app vs. sem a app). */
function tForProgress(v: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (withApp(mid) < v) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function PotentialChart({
  title,
  withLabel,
  withoutLabel,
  youProgress,
  youLabel,
}: {
  title: string;
  withLabel: string;
  withoutLabel: string;
  /** 0 a 1: quanto do caminho até ao objetivo a pessoa já fez (mostra "Você está aqui"). */
  youProgress?: number;
  youLabel?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - t0) / DURATION);
      setP(1 - Math.pow(1 - t, 2.2));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const head = Math.max(0.001, p);
  const area = `${pathUpTo(withApp, head)} L${X(head).toFixed(1)},${Y(0) + 8} L${X(0)},${Y(0) + 8} Z`;
  const done = p > 0.985;
  const youT = youProgress === undefined ? null : tForProgress(Math.min(0.97, Math.max(0.1, 0.1 + youProgress * 0.88)));
  const showYou = youT !== null && p >= youT;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: W, height: H, alignSelf: 'center' }}>
        <Svg width={W} height={H}>
          <Defs>
            <LinearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#4CAF50" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#4CAF50" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {[0.33, 0.66].map((g) => (
            <Line key={g} x1={PAD} x2={W - PAD} y1={Y(g)} y2={Y(g)} stroke={colors.border} strokeDasharray="3 5" />
          ))}
          <Line x1={PAD} x2={W - PAD} y1={Y(0) + 8} y2={Y(0) + 8} stroke={colors.border} />
          <Path d={area} fill="url(#pot)" />
          <Path d={pathUpTo(without, head)} stroke={colors.textFaint} strokeWidth={2.5} strokeDasharray="6 5" fill="none" strokeLinecap="round" />
          <Path d={pathUpTo(withApp, head)} stroke="#2E9E4F" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {CHECKPOINTS.slice(0, 3).map((c) =>
            p >= c ? <Circle key={c} cx={X(c)} cy={Y(withApp(c))} r={6} fill={colors.card} stroke={colors.text} strokeWidth={2.5} /> : null,
          )}
          <Circle cx={X(0)} cy={Y(without(0))} r={5} fill={colors.card} stroke={colors.textFaint} strokeWidth={2.5} />
          <Circle cx={X(head)} cy={Y(without(head))} r={5} fill={colors.card} stroke={colors.textFaint} strokeWidth={2.5} />
          {showYou && youT !== null && (
            <>
              <Circle cx={X(youT)} cy={Y(withApp(youT))} r={13} fill="#F08A4B" opacity={0.25} />
              <Circle cx={X(youT)} cy={Y(withApp(youT))} r={7} fill="#F08A4B" stroke="#fff" strokeWidth={2.5} />
            </>
          )}
          {!done && <Circle cx={X(head)} cy={Y(withApp(head))} r={6} fill="#2E9E4F" />}
        </Svg>
        {showYou && youT !== null && !!youLabel && (
          <View style={[styles.you, { left: Math.min(W - 70, Math.max(0, X(youT) - 30)), top: Y(withApp(youT)) - 38 }]}>
            <Text style={styles.youText}>{youLabel}</Text>
          </View>
        )}
        {done && (
          <View style={[styles.trophy, { left: X(1) - 14, top: Y(withApp(1)) - 14 }]}>
            <Trophy size={15} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisText}>{tr('3 dias')}</Text>
        <Text style={styles.axisText}>{tr('7 dias')}</Text>
        <Text style={styles.axisText}>{tr('30 dias')}</Text>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#2E9E4F' }]} />
          <Text style={styles.legendText}>{withLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.textFaint }]} />
          <Text style={styles.legendText}>{withoutLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 22, padding: 16, gap: 10 },
    title: { fontSize: font.h3, fontWeight: '600', color: colors.text },
    trophy: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: '#F08A4B', alignItems: 'center', justifyContent: 'center' },
    you: { position: 'absolute', backgroundColor: '#F08A4B', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    youText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    axis: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 },
    axisText: { fontSize: font.small, color: colors.textMuted },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: 18 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: font.small, color: colors.textMuted },
  });
