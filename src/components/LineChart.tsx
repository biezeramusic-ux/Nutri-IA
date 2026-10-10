import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Point {
  label: string;
  value: number;
}

interface Props {
  points: Point[];
  width: number;
  height?: number;
  /** Linha tracejada com a meta (ex.: peso desejado). */
  goal?: number;
  color?: string;
}

/** Gráfico de linha simples (evolução do peso). */
export function LineChart({ points, width, height = 110, goal, color: colorProp }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const color = colorProp ?? colors.primary;
  if (points.length === 0) return null;
  const values = points.map((p) => p.value).concat(goal !== undefined ? [goal] : []);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const padX = 8;
  const padY = 10;
  const x = (i: number) => (points.length === 1 ? width / 2 : padX + (i * (width - padX * 2)) / (points.length - 1));
  const y = (v: number) => padY + ((max - v) / (max - min)) * (height - padY * 2);

  return (
    <View>
      <Svg width={width} height={height}>
        {goal !== undefined && (
          <Line x1={padX} x2={width - padX} y1={y(goal)} y2={y(goal)} stroke={colors.primary} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
        )}
        {points.length > 1 && (
          <Polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {points.map((p, i) => (
          <Circle key={`${p.label}-${i}`} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 4 : 2.5} fill={color} />
        ))}
      </Svg>
      <View style={styles.axis}>
        <Text style={styles.axisText}>{points[0].label}</Text>
        {points.length > 1 && <Text style={styles.axisText}>{points[points.length - 1].label}</Text>}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontSize: font.tiny, color: colors.textMuted },
});
