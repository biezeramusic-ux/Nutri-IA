import { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAnimatedTo } from './Motion';
import { Text } from '../components/AppText';
import { font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export interface Bar {
  key: string;
  label: string;
  value: number;
  highlight?: boolean;
  /** Texto por cima da barra (ex.: "56%"). */
  caption?: string;
}

interface Props {
  bars: Bar[];
  /** Linha tracejada da meta (mesma unidade que value). */
  goal?: number;
  height?: number;
  /** Cor das barras normais / da barra em destaque. */
  barColor?: string;
  highlightColor?: string;
  /** Mostrar só 1 em cada N etiquetas do eixo (útil para o mês). */
  labelEvery?: number;
}

/** Gráfico de barras simples, sem bibliotecas. */
export function BarChart({ bars, goal, height = 150, barColor: barColorProp, highlightColor: highlightProp, labelEvery = 1 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const barColor = barColorProp ?? colors.lime;
  const highlightColor = highlightProp ?? colors.primary;
  const max = Math.max(goal ? goal * 1.2 : 0, ...bars.map((b) => b.value), 1);
  const plot = height - 38;
  const h = (v: number) => (v / max) * plot;
  const dense = bars.length > 10;
  const grow = useAnimatedTo(1, 800, 100);

  return (
    <View style={{ height }}>
      {goal !== undefined && <View style={[styles.goalLine, { bottom: h(goal) + 20 }]} />}
      <View style={styles.row}>
        {bars.map((b, i) => (
          <View key={b.key} style={styles.col}>
            {!dense && <Text style={styles.caption}>{b.value > 0 ? b.caption ?? '' : ''}</Text>}
            <View style={styles.track}>
              {b.value > 0 && (
                <Animated.View
                  style={{
                    width: dense ? '70%' : '64%',
                    height: grow.interpolate({ inputRange: [0, 1], outputRange: [4, Math.max(4, h(b.value))] }),
                    borderRadius: dense ? 3 : 6,
                    backgroundColor: b.highlight ? highlightColor : barColor,
                  }}
                />
              )}
            </View>
            <Text style={[styles.label, b.highlight && styles.labelActive]} numberOfLines={1}>
              {i % labelEvery === 0 ? b.label : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  col: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  caption: { fontSize: 10, fontWeight: '600', color: colors.textMuted, height: 13 },
  track: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  label: { fontSize: font.tiny, color: colors.textMuted, height: 14 },
  labelActive: { color: colors.text, fontWeight: '700' },
  goalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, opacity: 0.55 },
});
