import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Text as SvgText } from 'react-native-svg';
import { petalPalette, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Ingredient } from '../types';

interface Props {
  ingredients: Ingredient[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Gráfico em flor: uma pétala por ingrediente, espaçadas à volta do centro.
 * O comprimento de cada pétala cresce com a percentagem do ingrediente no prato,
 * e a percentagem exata aparece escrita dentro da pétala.
 */
export function FlowerChart({ ingredients, centerValue, centerLabel, size = 260 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const total = ingredients.reduce((sum, i) => sum + i.grams, 0) || 1;
  const count = Math.max(1, ingredients.length);
  const c = size / 2;
  const innerR = size * 0.16;
  const maxLength = c - 6 - innerR * 0.5;
  const maxPct = Math.max(...ingredients.map((i) => i.grams / total), 0.01);
  const stepDeg = 360 / count;

  const petals = ingredients.map((ing, idx) => {
    const pct = ing.grams / total;
    const angle = -90 + idx * stepDeg;
    // Comprimento entre 62% e 100% do máximo, proporcional à percentagem.
    const length = maxLength * (0.62 + 0.38 * (pct / maxPct));
    const ry = length / 2;
    // Largura limitada pelo espaço angular disponível.
    const arcRoom = (2 * Math.PI * (innerR * 0.5 + length * 0.55)) / count;
    const rx = Math.max(15, Math.min(ry * 0.62, arcRoom * 0.46));
    const dist = innerR * 0.5 + ry;
    const cx = c + dist * Math.cos(toRad(angle));
    const cy = c + dist * Math.sin(toRad(angle));
    const labelDist = innerR * 0.5 + ry * 1.25;
    return {
      key: `${ing.name}-${idx}`,
      color: petalPalette[idx % petalPalette.length],
      cx,
      cy,
      rx,
      ry,
      rotation: angle + 90,
      label: `${Math.round(pct * 100)}%`,
      lx: c + labelDist * Math.cos(toRad(angle)),
      ly: c + labelDist * Math.sin(toRad(angle)),
    };
  });

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {petals.map((p) => (
          <G key={p.key}>
            <Ellipse
              cx={p.cx}
              cy={p.cy}
              rx={p.rx}
              ry={p.ry}
              fill={p.color}
              opacity={0.92}
              transform={`rotate(${p.rotation} ${p.cx} ${p.cy})`}
            />
            <SvgText x={p.lx} y={p.ly + 4} fontSize={12} fontWeight="700" fill="#fff" textAnchor="middle">
              {p.label}
            </SvgText>
          </G>
        ))}
        <Circle cx={c} cy={c} r={innerR} fill={colors.card} />
        <SvgText x={c} y={c + 3} fontSize={19} fontWeight="700" fill={colors.text} textAnchor="middle">
          {centerValue}
        </SvgText>
        <SvgText x={c} y={c + 17} fontSize={10} fill={colors.textMuted} textAnchor="middle">
          {centerLabel}
        </SvgText>
      </Svg>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
