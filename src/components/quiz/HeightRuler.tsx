import { useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Text } from '../AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import type { Sex } from '../../types';
import { BodyFigure } from './BodyFigure';

const MIN = 100;
const MAX = 220;
const TICK = 10;
const AREA_H = 400;

const feetInches = (cm: number) => {
  const total = Math.round(cm / 2.54);
  return `${Math.floor(total / 12)}'${total % 12}"`;
};

/**
 * Altura: régua vertical à esquerda (deslize) e uma silhueta transparente, feminina ou masculina,
 * que sobe e desce com a altura. O número grande mostra cm ou pés.
 */
export function HeightRuler({ sex, age, cm, onChange }: { sex: Sex; age: number; cm: number; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ref = useRef<ScrollView>(null);
  const [imperial, setImperial] = useState(false);
  const last = useRef(cm);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: (cm - MIN) * TICK, animated: false }), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = Math.max(MIN, Math.min(MAX, MIN + Math.round(e.nativeEvent.contentOffset.y / TICK)));
    if (v !== last.current) {
      last.current = v;
      onChange(v);
    }
  };

  const figH = 150 + ((cm - MIN) / (MAX - MIN)) * 230;
  const ticks = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        {[false, true].map((imp) => (
          <Pressable key={String(imp)} style={[styles.toggleBtn, imperial === imp && styles.toggleOn]} onPress={() => setImperial(imp)}>
            <Text style={[styles.toggleText, imperial === imp && { color: colors.background }]}>{imp ? 'FT' : 'CM'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
        <Text style={styles.big}>{imperial ? feetInches(cm) : cm}</Text>
        {!imperial && <Text style={styles.unit}>cm</Text>}
      </View>

      <View style={{ height: AREA_H }}>
        <View style={styles.figure} pointerEvents="none">
          <View style={{ opacity: 0.3 }}>
            <BodyFigure sex={sex} age={age} h={figH} color={colors.textMuted} />
          </View>
        </View>
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={TICK}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          style={styles.ruler}
          contentContainerStyle={{ paddingVertical: AREA_H / 2 - TICK / 2 }}
        >
          {ticks.map((v) => {
            const major = v % 5 === 0;
            return (
              <View key={v} style={styles.tickRow}>
                <Svg width={70} height={TICK}>
                  <Line x1={0} y1={TICK / 2} x2={major ? 36 : 20} y2={TICK / 2} stroke={major ? colors.textMuted : colors.textFaint} strokeWidth={major ? 2 : 1.2} />
                </Svg>
                {major && <Text style={styles.tickLabel}>{v}</Text>}
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.line} pointerEvents="none" />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    toggle: { flexDirection: 'row', alignSelf: 'center', gap: 8 },
    toggleBtn: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
    toggleOn: { backgroundColor: colors.text, borderColor: colors.text },
    toggleText: { fontWeight: '800', color: colors.textMuted },
    big: { fontSize: 64, lineHeight: 72, fontWeight: '800', color: colors.text, letterSpacing: -2 },
    unit: { fontSize: 30, fontWeight: '700', color: colors.textFaint },
    ruler: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 80 },
    tickRow: { height: TICK, flexDirection: 'row', alignItems: 'center' },
    tickLabel: { position: 'absolute', left: 42, fontSize: font.small, color: colors.textMuted, lineHeight: 14 },
    line: { position: 'absolute', left: 0, right: '30%', top: AREA_H / 2 - 1.5, height: 3, borderRadius: 2, backgroundColor: colors.text },
    figure: { position: 'absolute', right: 20, bottom: 0, left: 90, alignItems: 'center', justifyContent: 'flex-end' },
  });
