import { useEffect, useMemo, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../AppText';
import { font, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

const TICK = 12;

interface Props {
  value: number;
  min: number;
  max: number;
  /** Valor de cada risco (0,5 kg por defeito). */
  step?: number;
  unit: string;
  width: number;
  onChange: (v: number) => void;
}

/** Régua horizontal: deslize para os lados e o risco central marca o valor, com o número grande por cima. */
export function RulerPicker({ value, min, max, step = 0.5, unit, width, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ref = useRef<ScrollView>(null);
  const count = Math.round((max - min) / step) + 1;
  const toX = (v: number) => ((v - min) / step) * TICK;
  const lastEmit = useRef(value);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ x: toX(value), animated: false }), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(count - 1, Math.round(e.nativeEvent.contentOffset.x / TICK)));
    const v = Math.round((min + i * step) * 10) / 10;
    if (v !== lastEmit.current) {
      lastEmit.current = v;
      onChange(v);
    }
  };

  const ticks = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <View style={{ width, alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={styles.big}>{value.toFixed(1).replace('.', ',')}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <View style={{ width, height: 84 }}>
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={emit}
          contentContainerStyle={{ paddingHorizontal: width / 2 - TICK / 2, alignItems: 'flex-end' }}
        >
          {ticks.map((i) => {
            const v = min + i * step;
            const major = Math.abs(v - Math.round(v)) < 1e-6 && Math.round(v) % 5 === 0;
            const whole = Math.abs(v - Math.round(v)) < 1e-6;
            return (
              <View key={i} style={{ width: TICK, alignItems: 'center' }}>
                <View style={{ width: 2, height: major ? 44 : whole ? 28 : 16, borderRadius: 1, backgroundColor: major ? colors.text : colors.textFaint }} />
                {major && <Text style={styles.label}>{Math.round(v)}</Text>}
              </View>
            );
          })}
        </ScrollView>
        <View pointerEvents="none" style={[styles.needle, { left: width / 2 - 1.5 }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    big: { fontSize: 52, lineHeight: 58, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    unit: { fontSize: font.h3, fontWeight: '600', color: colors.textMuted },
    label: { position: 'absolute', top: 48, width: 40, textAlign: 'center', fontSize: 10, color: colors.textMuted },
    needle: { position: 'absolute', top: 0, width: 3, height: 58, borderRadius: 2, backgroundColor: colors.primary },
  });
