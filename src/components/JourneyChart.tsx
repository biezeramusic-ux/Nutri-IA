import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Text } from './AppText';
import { font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export interface JourneyPoint {
  /** Momento (ms) do registo de peso. */
  t: number;
  /** Progresso até à meta, em %: 0 = peso inicial, 100 = peso desejado. */
  pct: number;
}

interface Props {
  width: number;
  startMs: number;
  deadlineMs: number;
  points: JourneyPoint[];
  emptyText: string;
  goalLabel: string;
  deadlineLabel: string;
}

const H = 190;
const PAD_L = 34;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 28;
const UP = '#2E9E4F';
const DOWN = '#E5484D';

const fmtDate = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Progresso em tempo real: sobe (verde) quando se aproxima da meta e cai (vermelho) quando se afasta. */
export function JourneyChart({ width, startMs, deadlineMs, points, emptyText, goalLabel, deadlineLabel }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [p, setP] = useState(0);
  const sig = JSON.stringify(points);

  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - t0) / 1300);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    setP(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sig]);

  const now = Date.now();
  const all: JourneyPoint[] = [{ t: startMs, pct: 0 }, ...points.filter((q) => q.t > startMs)].sort((a, b) => a.t - b.t);
  const lastMs = all.length > 1 ? all[all.length - 1].t : now;
  const span = Math.max(14 * 86400000, (Math.max(now, lastMs) - startMs) * 1.3);
  const endMs = startMs + span;
  const showDeadline = deadlineMs <= endMs;
  const lows = Math.min(-20, ...all.map((q) => q.pct));
  const highs = Math.max(110, ...all.map((q) => q.pct));
  const plotW = width - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const x = (t: number) => PAD_L + ((t - startMs) / Math.max(1, endMs - startMs)) * plotW;
  const y = (v: number) => PAD_T + (1 - (v - lows) / (highs - lows)) * plotH;

  const empty = all.length < 2;
  const revealX = PAD_L + (x(all[all.length - 1].t) - PAD_L) * p;

  // Segmentos coloridos pela direção (subir = verde, descer = vermelho), cortados pela animação.
  const segs: { d: string; color: string }[] = [];
  for (let i = 1; i < all.length; i++) {
    const a = all[i - 1];
    const b = all[i];
    const ax = x(a.t);
    const bx = x(b.t);
    if (ax >= revealX) break;
    const frac = Math.min(1, (revealX - ax) / Math.max(1, bx - ax));
    const ex = ax + (bx - ax) * frac;
    const ey = y(a.pct + (b.pct - a.pct) * frac);
    segs.push({ d: `M${ax},${y(a.pct)} L${ex},${ey}`, color: b.pct >= a.pct ? UP : DOWN });
  }
  const last = segs.length ? all[Math.min(all.length - 1, segs.length)] : null;
  let headX = x(all[0].t);
  let headY = y(0);
  if (!empty && last) {
    const i = Math.min(all.length - 1, segs.length);
    const a = all[i - 1];
    const b = all[i];
    const frac = Math.min(1, (revealX - x(a.t)) / Math.max(1, x(b.t) - x(a.t)));
    headX = x(a.t) + (x(b.t) - x(a.t)) * frac;
    headY = y(a.pct + (b.pct - a.pct) * frac);
  }
  const lastPct = all[all.length - 1].pct;
  const headColor = all.length > 1 && all[all.length - 1].pct < all[all.length - 2].pct ? DOWN : UP;
  const areaD = !empty ? `M${x(all[0].t)},${y(0)} ${all.map((q) => `L${Math.min(x(q.t), revealX)},${y(q.pct)}`).join(' ')} L${headX},${y(Math.min(0, lows))} L${x(all[0].t)},${y(Math.min(0, lows))} Z` : '';

  return (
    <View>
      <Svg width={width} height={H}>
        <Defs>
          <LinearGradient id="jr" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={UP} stopOpacity={0.22} />
            <Stop offset="1" stopColor={UP} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {[0, 50, 100].map((g) => (
          <G key={g}>
            <Line x1={PAD_L} x2={width - PAD_R} y1={y(g)} y2={y(g)} stroke={colors.border} strokeDasharray={g === 100 ? undefined : '3 5'} strokeWidth={g === 100 ? 1.4 : 1} />
            <SvgText x={PAD_L - 6} y={y(g) + 3.5} fontSize={10} fill={colors.textMuted} textAnchor="end">{`${g}%`}</SvgText>
          </G>
        ))}
        {showDeadline && <Line x1={x(deadlineMs)} x2={x(deadlineMs)} y1={PAD_T} y2={H - PAD_B} stroke={colors.textFaint} strokeDasharray="4 4" />}
        <SvgText x={width - PAD_R} y={H - 10} fontSize={10} fill={colors.textMuted} textAnchor="end">{`${deadlineLabel} ${fmtDate(deadlineMs)}${showDeadline ? '' : ' →'}`}</SvgText>
        <SvgText x={PAD_L} y={H - 10} fontSize={10} fill={colors.textMuted}>{fmtDate(startMs)}</SvgText>
        <SvgText x={width - PAD_R} y={y(100) - 5} fontSize={10} fontWeight="700" fill={UP} textAnchor="end">{goalLabel}</SvgText>
        {!empty && <Path d={areaD} fill="url(#jr)" />}
        {segs.map((s, i) => (
          <Path key={i} d={s.d} stroke={s.color} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        ))}
        {!empty &&
          all.map((q, i) => (q.t <= startMs + (revealX - PAD_L) / plotW * (endMs - startMs) + 1 ? <Circle key={i} cx={x(q.t)} cy={y(q.pct)} r={i === all.length - 1 ? 0 : 3.5} fill={colors.card} stroke={q.pct >= (all[i - 1]?.pct ?? 0) ? UP : DOWN} strokeWidth={2} /> : null))}
        <Circle cx={headX} cy={headY} r={empty ? 5 : 7} fill={empty ? colors.textFaint : headColor} stroke={colors.card} strokeWidth={2.5} />
      </Svg>
      {empty && (
        <View style={styles.emptyWrap} pointerEvents="none">
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}
      {!empty && p > 0.95 && (
        <Text style={[styles.status, { color: headColor, left: Math.min(width - 60, headX + 10), top: Math.max(0, headY - 28) }]}>{`${lastPct >= 0 ? '' : '−'}${Math.abs(Math.round(lastPct))}%`}</Text>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    emptyWrap: { position: 'absolute', left: PAD_L, right: PAD_R, top: PAD_T + 30, alignItems: 'center' },
    emptyText: { fontSize: font.small, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
    status: { position: 'absolute', fontSize: font.h3, fontWeight: '800' },
  });
