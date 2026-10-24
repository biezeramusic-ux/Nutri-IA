import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeColors } from '../../constants/theme';

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** 'x' arrasta na horizontal (idade, peso); 'y' arrasta na vertical, para cima aumenta (altura). */
  axis?: 'x' | 'y';
  length: number;
}

/** Barra com bolinha para arrastar com o dedo. Toque ou arraste em qualquer ponto da barra. */
export function DragSlider({ value, min, max, onChange, axis = 'x', length }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const live = useRef({ value, min, max, onChange, length, axis });
  live.current = { value, min, max, onChange, length, axis };
  const start = useRef(0);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const c = live.current;
          const pos = c.axis === 'x' ? e.nativeEvent.locationX : c.length - e.nativeEvent.locationY;
          const frac = Math.max(0, Math.min(1, pos / c.length));
          start.current = Math.round(c.min + frac * (c.max - c.min));
          c.onChange(start.current);
        },
        onPanResponderMove: (_, g) => {
          const c = live.current;
          const d = c.axis === 'x' ? g.dx : -g.dy;
          const next = Math.round(start.current + (d / c.length) * (c.max - c.min));
          c.onChange(Math.max(c.min, Math.min(c.max, next)));
        },
      }),
    [],
  );

  const frac = (value - min) / Math.max(1, max - min);
  const horiz = axis === 'x';
  return (
    <View style={horiz ? { width: length, height: 44 } : { width: 44, height: length }} {...pan.panHandlers}>
      <View style={horiz ? styles.trackH : styles.trackV} pointerEvents="none">
        <View style={horiz ? [styles.fillH, { width: `${frac * 100}%` }] : [styles.fillV, { height: `${frac * 100}%` }]} />
      </View>
      <View
        pointerEvents="none"
        style={[styles.thumb, horiz ? { left: frac * (length - 30), top: 7 } : { bottom: frac * (length - 30), left: 7 }]}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    trackH: { position: 'absolute', left: 0, right: 0, top: 18, height: 8, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
    fillH: { height: 8, backgroundColor: colors.primary },
    trackV: { position: 'absolute', top: 0, bottom: 0, left: 18, width: 8, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden', justifyContent: 'flex-end' },
    fillV: { width: 8, backgroundColor: colors.primary },
    thumb: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', borderWidth: 4, borderColor: colors.primary, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  });
