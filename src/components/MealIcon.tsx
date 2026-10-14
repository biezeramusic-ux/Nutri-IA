import { useMemo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { View } from 'react-native';
import { radius } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { MealType } from '../types';

const AMBER = '#FBBF24';

/** Ícone desenhado de cada refeição, nas cores da app (verde e âmbar), em vez de emojis. */
export function MealGlyph({ type, size }: { type: MealType; size: number }) {
  const { colors } = useTheme();
  const green = colors.primary;
  const stroke = { stroke: green, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  const art = useMemo(() => {
    switch (type) {
      case 'breakfast': // chávena com vapor
        return (
          <>
            <Path d="M5 10h11v3.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" {...stroke} fill={AMBER} fillOpacity={0.45} />
            <Path d="M16 11.5h1.4a2.4 2.4 0 0 1 0 4.8H15.6" {...stroke} />
            <Path d="M8 3.2c-1 1.3 1 2.2 0 3.6M12 3.2c-1 1.3 1 2.2 0 3.6" {...stroke} />
            <Path d="M4 21h13" {...stroke} />
          </>
        );
      case 'lunch': // prato com talheres
        return (
          <>
            <Circle cx="12" cy="12.5" r="6" {...stroke} />
            <Circle cx="12" cy="12.5" r="3.2" fill={AMBER} />
            <Path d="M2.5 4v5a1.6 1.6 0 0 0 1.6 1.6V20M4.1 4v6.6M5.7 4v5" {...stroke} />
            <Path d="M21.5 4c-1.8 1.2-2 5-.2 6.2V20" {...stroke} />
          </>
        );
      case 'snack': // maçã com folha
        return (
          <>
            <Path d="M12 8.2c-2.2-1.7-6.2-1-6.2 3.6 0 4.2 2.6 8.7 6.2 8.7s6.2-4.5 6.2-8.7c0-4.600-4-5.300-6.200-3.600z" {...stroke} fill={AMBER} fillOpacity={0.55} />
            <Path d="M12 7.5c0-2.200 1-3.700 3.200-4.300 0 2.300-1 3.800-3.200 4.300z" stroke={green} strokeWidth={1.5} strokeLinejoin="round" fill={green} />
          </>
        );
      default: // jantar: lua e estrelas
        return (
          <>
            <Path d="M20 14.600A8 8 0 1 1 9.400 4a6.500 6.500 0 0 0 10.600 10.600z" {...stroke} fill={AMBER} fillOpacity={0.55} />
            <Circle cx="17.500" cy="5.500" r="1.100" fill={green} />
            <Circle cx="21" cy="9.500" r="0.800" fill={green} />
          </>
        );
    }
  }, [type, stroke.stroke]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {art}
    </Svg>
  );
}

/** Prato desenhado (em vez do emoji do alimento), para as listas de refeições. */
export function DishGlyph({ size = 22 }: { size?: number }) {
  return <MealGlyph type="lunch" size={size} />;
}

/** Emblema quadrado com o ícone da refeição. */
export function MealIcon({ type, size = 36 }: { type: MealType; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{ width: size, height: size, borderRadius: size <= 32 ? radius.sm : radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <MealGlyph type={type} size={size * 0.7} />
    </View>
  );
}
