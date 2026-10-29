import { useMemo } from 'react';
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

interface Point {
  label: string;
  value: number;
}

const PAD_L = 38;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 26;

/** Escala "bonita": passo de 1, 2, 5, 10... para que as linhas tenham números redondos. */
function niceScale(min: number, max: number, ticks = 5): { lo: number; hi: number; step: number } {
  const span = Math.max(1, max - min);
  const raw = span / (ticks - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  return { lo, hi: hi === lo ? lo + step : hi, step };
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** Gráfico de peso com o eixo dos kg à esquerda, grelha, datas em baixo, linha da meta e o último valor em destaque. */
export function WeightChart({ points, width, height = 210, goal, goalLabel }: { points: Point[]; width: number; height?: number; goal?: number; goalLabel?: string }) {
  const { colors } = useTheme();
  const geo = useMemo(() => {
    const vals = points.map((p) => p.value).concat(goal !== undefined ? [goal] : []);
    const { lo, hi, step } = niceScale(Math.min(...vals), Math.max(...vals));
    const n = Math.round((hi - lo) / step);
    const levels = Array.from({ length: n + 1 }, (_, i) => lo + i * step);
    return { lo, hi, levels };
  }, [points, goal]);
  if (points.length === 0) return null;

  const innerW = width - PAD_L - PAD_R;
  const innerH = height - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (points.length === 1 ? innerW / 2 : (i * innerW) / (points.length - 1));
  const y = (v: number) => PAD_T + ((geo.hi - v) / (geo.hi - geo.lo)) * innerH;

  // Até 5 datas repartidas ao longo do eixo.
  const maxLabels = Math.min(5, points.length);
  const labelIdx = Array.from(new Set(Array.from({ length: maxLabels }, (_, k) => Math.round((k * (points.length - 1)) / Math.max(1, maxLabels - 1)))));
  const last = points.length - 1;
  const lastX = x(last);
  const bubbleW = 52;
  const bubbleX = Math.min(width - PAD_R - bubbleW, Math.max(PAD_L, lastX - bubbleW / 2));

  return (
    <Svg width={width} height={height}>
      {geo.levels.map((v) => (
        <G key={v}>
          <Line x1={PAD_L} x2={width - PAD_R} y1={y(v)} y2={y(v)} stroke={colors.border} strokeWidth={1} />
          <SvgText x={PAD_L - 6} y={y(v) + 4} fontSize={11} fill={colors.textMuted} textAnchor="end">
            {fmt(v)}
          </SvgText>
        </G>
      ))}
      {goal !== undefined && (
        <G>
          <Line x1={PAD_L} x2={width - PAD_R} y1={y(goal)} y2={y(goal)} stroke={colors.primary} strokeWidth={1.5} strokeDasharray="5 4" />
          {!!goalLabel && (
            <SvgText x={width - PAD_R - 2} y={y(goal) - 5} fontSize={10} fontWeight="700" fill={colors.primaryDark} textAnchor="end">
              {goalLabel} {fmt(goal)}
            </SvgText>
          )}
        </G>
      )}
      {points.length > 1 && <Polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} fill="none" stroke="#2E6FD8" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <Circle key={`${p.label}-${i}`} cx={x(i)} cy={y(p.value)} r={i === last ? 5 : 3} fill={i === last ? '#2E6FD8' : colors.card} stroke="#2E6FD8" strokeWidth={2} />
      ))}
      <G>
        <Rect x={bubbleX} y={Math.max(0, y(points[last].value) - 28)} width={bubbleW} height={20} rx={10} fill="#2E6FD8" />
        <SvgText x={bubbleX + bubbleW / 2} y={Math.max(0, y(points[last].value) - 28) + 14} fontSize={11} fontWeight="700" fill="#fff" textAnchor="middle">
          {fmt(points[last].value)} kg
        </SvgText>
      </G>
      {labelIdx.map((i) => (
        <SvgText key={`x${i}`} x={x(i)} y={height - 6} fontSize={11} fill={colors.textMuted} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}>
          {points[i].label}
        </SvgText>
      ))}
    </Svg>
  );
}
