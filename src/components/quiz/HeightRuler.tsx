import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { G, Line, Text as SvgText } from 'react-native-svg';
import { Text } from '../AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import type { Sex } from '../../types';
import { BodyFigure } from './BodyFigure';

const MIN = 100;
const MAX = 220;
const TICK = 10;
const AREA_H = 420;

const feetInches = (cm: number) => {
  const total = Math.round(cm / 2.54);
  return `${Math.floor(total / 12)}'${total % 12}"`;
};

/**
 * Altura: régua vertical à esquerda (deslize) e uma silhueta transparente, feminina ou masculina,
 * que sobe e desce com a altura. O número grande mostra cm ou pés.
 */
export function HeightRuler({ sex, age, cm, onChange, onDrag }: { sex: Sex; age: number; cm: number; onChange: (v: number) => void; onDrag?: (dragging: boolean) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [imperial, setImperial] = useState(false);
  const live = useRef({ cm, onChange, onDrag });
  live.current = { cm, onChange, onDrag };
  const startCm = useRef(cm);
  const momentum = useRef<ReturnType<typeof setInterval> | null>(null);
  const value = useRef(cm);
  value.current = cm;

  const apply = (v: number) => {
    const next = Math.max(MIN, Math.min(MAX, Math.round(v)));
    if (next !== live.current.cm) {
      live.current.onChange(next);
      Haptics.selectionAsync().catch(() => undefined);
    }
  };

  // Arraste com o dedo em qualquer ponto da zona: para cima a altura sobe, para baixo desce, com inércia ao largar.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          if (momentum.current) clearInterval(momentum.current);
          startCm.current = live.current.cm;
          live.current.onDrag?.(true);
        },
        onPanResponderMove: (_, g) => apply(startCm.current - g.dy / TICK),
        onPanResponderRelease: (_, g) => {
          live.current.onDrag?.(false);
          let v = Math.max(-1.2, Math.min(1.2, -g.vy * 2.5)); // cm por quadro (aprox.)
          if (Math.abs(v) < 0.15) return;
          let pos = live.current.cm;
          momentum.current = setInterval(() => {
            pos += v;
            v *= 0.9;
            apply(pos);
            if (Math.abs(v) < 0.04 && momentum.current) clearInterval(momentum.current);
          }, 16);
        },
        onPanResponderTerminate: () => live.current.onDrag?.(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => () => {
    if (momentum.current) clearInterval(momentum.current);
  }, []);

  const figH = 150 + ((cm - MIN) / (MAX - MIN)) * 230;
  const half = Math.ceil(AREA_H / 2 / TICK) + 1;
  const ticks: number[] = [];
  for (let v = cm - half; v <= cm + half; v++) if (v >= MIN && v <= MAX) ticks.push(v);

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        {[false, true].map((imp) => (
          <Pressable key={String(imp)} style={[styles.toggleBtn, imperial === imp && styles.toggleOn]} onPress={() => setImperial(imp)}>
            <Text style={[styles.toggleText, imperial === imp && { color: '#fff' }]}>{imp ? 'FT' : 'CM'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
        <Text style={styles.big}>{imperial ? feetInches(cm) : cm}</Text>
        {!imperial && <Text style={styles.unit}>cm</Text>}
      </View>

      <View style={{ height: AREA_H }} {...pan.panHandlers}>
        <View style={styles.figure} pointerEvents="none">
          <View style={{ opacity: 0.3 }}>
            <BodyFigure sex={sex} age={age} h={figH} color={colors.textMuted} />
          </View>
        </View>
        <View style={styles.ruler} pointerEvents="none">
          <Svg width={80} height={AREA_H}>
            {ticks.map((v) => {
              const y = AREA_H / 2 + (v - cm) * TICK;
              const major = v % 5 === 0;
              return (
                <G key={v}>
                  <Line x1={0} y1={y} x2={major ? 36 : 20} y2={y} stroke={major ? colors.textMuted : colors.textFaint} strokeWidth={major ? 2 : 1.2} />
                  {major && (
                    <SvgText x={42} y={y + 4} fontSize={13} fill={colors.textMuted}>
                      {v}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        </View>
        <View style={styles.line} pointerEvents="none" />
        <Text style={styles.hint} pointerEvents="none">
          ↕
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    toggle: { flexDirection: 'row', alignSelf: 'center', gap: 8 },
    toggleBtn: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
    toggleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    toggleText: { fontWeight: '800', color: colors.textMuted },
    big: { fontSize: 64, lineHeight: 72, fontWeight: '800', color: colors.text, letterSpacing: -2 },
    unit: { fontSize: 30, fontWeight: '700', color: colors.textFaint },
    ruler: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 80 },
    hint: { position: 'absolute', right: 8, top: AREA_H / 2 - 14, fontSize: 22, color: colors.textFaint },
    line: { position: 'absolute', left: 80, right: '30%', top: AREA_H / 2 - 1.5, height: 3, borderRadius: 2, backgroundColor: colors.primary },
    figure: { position: 'absolute', right: 20, bottom: 0, left: 90, alignItems: 'center', justifyContent: 'flex-end' },
  });
