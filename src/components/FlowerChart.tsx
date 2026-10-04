import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Circle, Text as SvgText } from 'react-native-svg';
import { colors, petalPalette } from '../constants/theme';
import type { Ingredient } from '../types';

interface Props {
  ingredients: Ingredient[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Gráfico em flor: cada ingrediente é uma pétala arredondada. A abertura angular
 * é proporcional à percentagem exata do ingrediente no prato.
 */
export function FlowerChart({ ingredients, centerValue, centerLabel, size = 300 }: Props) {
  const total = ingredients.reduce((sum, i) => sum + i.grams, 0) || 1;
  const c = size / 2;
  const maxR = c - 8;
  const innerR = size * 0.17;

  let cursor = -90;
  const petals = ingredients.map((ing, idx) => {
    const pct = ing.grams / total;
    const span = pct * 360;
    const mid = cursor + span / 2;
    cursor += span;

    // Pétala maior para ingredientes mais presentes; largura limitada pela abertura angular.
    const length = Math.max(innerR + 28, innerR + (maxR - innerR) * (0.55 + 0.45 * Math.min(1, pct * 2.2)));
    const ry = (length - innerR * 0.6) / 2;
    const chord = 2 * length * Math.sin(toRad(Math.min(span, 140)) / 2) * 0.46;
    const rx = Math.max(12, Math.min(chord, ry * 0.9));
    const distance = innerR * 0.6 + ry;
    const px = c + distance * Math.cos(toRad(mid));
    const py = c + distance * Math.sin(toRad(mid));
    const labelR = innerR * 0.6 + ry * 1.25;
    return {
      key: `${ing.name}-${idx}`,
      color: petalPalette[idx % petalPalette.length],
      px,
      py,
      rx,
      ry,
      mid,
      label: `${Math.round(pct * 100)}%`,
      lx: c + labelR * Math.cos(toRad(mid)),
      ly: c + labelR * Math.sin(toRad(mid)),
    };
  });

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {petals.map((p) => (
          <G key={p.key}>
            <Ellipse
              cx={p.px}
              cy={p.py}
              rx={p.rx}
              ry={p.ry}
              fill={p.color}
              opacity={0.92}
              transform={`rotate(${p.mid + 90} ${p.px} ${p.py})`}
            />
            <SvgText
              x={p.lx}
              y={p.ly + 5}
              fontSize={14}
              fontWeight="800"
              fill="#fff"
              textAnchor="middle"
            >
              {p.label}
            </SvgText>
          </G>
        ))}
        <Circle cx={c} cy={c} r={innerR} fill="#fff" />
        <SvgText x={c} y={c + 2} fontSize={22} fontWeight="800" fill={colors.text} textAnchor="middle">
          {centerValue}
        </SvgText>
        <SvgText x={c} y={c + 20} fontSize={11} fill={colors.textMuted} textAnchor="middle">
          {centerLabel}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
