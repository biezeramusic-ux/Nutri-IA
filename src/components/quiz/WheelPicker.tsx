import { useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

const ITEM_H = 52;
const VISIBLE = 5;

interface Props {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  /** Largura da roda (por defeito ocupa o espaço disponível). */
  width?: number;
  /** true quando está numa linha com outras rodas (reparte a largura). */
  grow?: boolean;
}

/** Roda para escolher um valor: role com o dedo, o número do meio fica destacado numa faixa verde. */
export function WheelPicker({ values, value, onChange, format = String, width, grow }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ref = useRef<ScrollView>(null);
  const idxOf = (v: number) => Math.max(0, values.indexOf(v));
  const [active, setActive] = useState(idxOf(value));
  const last = useRef(idxOf(value));

  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: idxOf(value) * ITEM_H, animated: false }), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Se o valor mudar por fora (ex.: trocar de unidade), a roda acompanha.
  useEffect(() => {
    const i = idxOf(value);
    if (i !== last.current) {
      last.current = i;
      setActive(i);
      ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(values.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
    last.current = i;
    setActive(i);
    if (values[i] !== value) onChange(values[i]);
  };

  return (
    <View style={[styles.wrap, width ? { width } : grow ? { flex: 1 } : { alignSelf: 'stretch' }]}>
      <View style={styles.band} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => setActive(Math.max(0, Math.min(values.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_H))))}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: ITEM_H * ((VISIBLE - 1) / 2) }}
      >
        {values.map((v, i) => {
          const d = Math.abs(i - active);
          return (
            <View key={v} style={styles.item}>
              <Text style={[styles.text, d === 0 && styles.textOn, { opacity: d === 0 ? 1 : d === 1 ? 0.5 : 0.22 }]}>{format(v)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { height: ITEM_H * VISIBLE, justifyContent: 'center' },
    band: { position: 'absolute', left: 0, right: 0, top: ITEM_H * ((VISIBLE - 1) / 2), height: ITEM_H, borderRadius: radius.lg, backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primary },
    item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
    text: { fontSize: font.h2, fontWeight: '600', color: colors.textMuted },
    textOn: { fontSize: 26, fontWeight: '800', color: colors.text },
  });
