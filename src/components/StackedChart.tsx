import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

interface Props {
  width: number;
  height?: number;
  labels: string[];
  /** Por barra: valores empilhados (de baixo para cima). */
  stacks: number[][];
  colors: string[];
  /** Linha tracejada horizontal (meta). */
  goal?: number;
  /** Linha com pontos (ex.: total queimado), um valor por barra (ou null). */
  line?: (number | null)[];
  /** Gradiente vertical em vez de cores por série (ex.: água). */
  gradient?: [string, string];
  labelEvery?: number;
  rotate?: boolean;
}

const fmtTick = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : v < 10 ? String(+v.toFixed(1)) : String(Math.round(v)));

function niceMax(v: number): { max: number; step: number } {
  const raw = Math.max(v, 1) / 3;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  return { max: step * 3, step };
}

/** Gráfico de barras empilhadas (por refeição) com eixo, grelha, meta e linha opcional. */
export function StackedChart({ width, height = 190, labels, stacks, colors: serie, goal, line, gradient, labelEvery = 1, rotate = true }: Props) {
  const { colors } = useTheme();
  const left = 38;
  const bottom = rotate ? 34 : 22;
  const top = 8;
  const plotW = width - left - 6;
  const plotH = height - top - bottom;

  const { max } = useMemo(() => {
    const totals = stacks.map((s) => s.reduce((a, b) => a + b, 0));
    const peak = Math.max(...totals, goal ?? 0, ...(line ?? []).map((v) => v ?? 0), 1);
    return niceMax(peak * 1.05);
  }, [stacks, goal, line]);

  const y = (v: number) => top + plotH - (v / max) * plotH;
  const slot = plotW / Math.max(1, stacks.length);
  const barW = Math.min(26, slot * (stacks.length > 14 ? 0.62 : 0.5));
  const cx = (i: number) => left + slot * i + slot / 2;
  const ticks = [0, max / 3, (2 * max) / 3, max];
  const r = Math.min(7, barW / 2);

  /** Barra com cantos arredondados só no topo do segmento mais alto. */
  const segPath = (x: number, yTop: number, yBot: number, round: boolean) => {
    const h = yBot - yTop;
    if (h <= 0) return '';
    const rr = round ? Math.min(r, h) : 0;
    return `M${x},${yBot} L${x},${yTop + rr} Q${x},${yTop} ${x + rr},${yTop} L${x + barW - rr},${yTop} Q${x + barW},${yTop} ${x + barW},${yTop + rr} L${x + barW},${yBot} Z`;
  };

  const linePts = (line ?? []).map((v, i) => (v == null ? null : { x: cx(i), y: y(v) }));
  const lineD = linePts.reduce((d, p) => (p ? `${d}${d && !d.endsWith('Z') ? 'L' : 'M'}${p.x},${p.y} ` : d), '');

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          {gradient && (
            <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
          )}
        </Defs>
        {ticks.map((t, i) => (
          <G key={i}>
            <Line x1={left} x2={width - 4} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} opacity={i === 0 ? 1 : 0.7} />
            <SvgText x={left - 6} y={y(t) + 3.5} fontSize={10} fill={colors.textMuted} textAnchor="end">
              {fmtTick(t)}
            </SvgText>
          </G>
        ))}
        {stacks.map((s, i) => {
          let acc = 0;
          const lastIdx = s.reduce((li, v, k) => (v > 0 ? k : li), -1);
          return (
            <G key={i}>
              {s.map((v, k) => {
                if (v <= 0) return null;
                const yBot = y(acc);
                acc += v;
                const yTop = y(acc);
                return (
                  <Path
                    key={k}
                    d={segPath(cx(i) - barW / 2, yTop, yBot - (k > 0 ? 1.5 : 0), k === lastIdx)}
                    fill={gradient ? 'url(#barGrad)' : serie[k % serie.length]}
                  />
                );
              })}
            </G>
          );
        })}
        {goal !== undefined && (
          <Line x1={left} x2={width - 4} y1={y(goal)} y2={y(goal)} stroke={colors.textMuted} strokeWidth={1.2} strokeDasharray="5 5" />
        )}
        {lineD !== '' && <Path d={lineD} fill="none" stroke={colors.text} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" opacity={0.8} />}
        {linePts.map((p, i) => (p ? <Rect key={`d${i}`} x={p.x - 3} y={p.y - 3} width={6} height={6} rx={3} fill={colors.text} /> : null))}
        {labels.map((l, i) =>
          i % labelEvery === 0 ? (
            <SvgText
              key={`l${i}`}
              x={cx(i)}
              y={height - bottom + (rotate ? 16 : 15)}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor={rotate ? 'end' : 'middle'}
              rotation={rotate ? -35 : 0}
              origin={`${cx(i)}, ${height - bottom + 16}`}
            >
              {l}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
}
