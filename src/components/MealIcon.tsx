import { useMemo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { View } from 'react-native';
import { radius } from '../constants/theme';
import type { MealType } from '../types';


/** Ícone desenhado de cada refeição, nas cores da app (verde e âmbar), em vez de emojis. */
export function MealGlyph({ type, size }: { type: MealType; size: number }) {
  const art = useMemo(() => {
    switch (type) {
      case 'breakfast': // chávena de café com vapor
        return (
          <>
            <Path d="M16.200 11.500h1.300a2.600 2.600 0 0 1 0 5.200h-1.800" stroke="#F97316" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <Path d="M4.500 9.500h12v4.200a5.300 5.300 0 0 1-5.300 5.300h-1.400a5.300 5.300 0 0 1-5.300-5.300z" fill="#F97316" />
            <Path d="M4.500 9.500h12v1.600a6 2.200 0 0 1-12 0z" fill="#7C4A21" />
            <Path d="M7.500 2.800c-1.100 1.300 1.100 2.100 0 3.600M11 2.800c-1.100 1.300 1.100 2.100 0 3.600M14.500 2.800c-1.100 1.300 1.100 2.100 0 3.600" stroke="#FB923C" strokeWidth={1.4} strokeLinecap="round" fill="none" />
            <Path d="M3.500 21h14" stroke="#F97316" strokeWidth={1.6} strokeLinecap="round" />
          </>
        );
      case 'lunch': // prato com comida colorida
        return (
          <>
            <Circle cx="12" cy="12.500" r="9" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1.2} />
            <Circle cx="12" cy="12.500" r="6.200" fill="#F1F5F9" />
            <Circle cx="9.800" cy="11.200" r="2.700" fill="#22C55E" />
            <Circle cx="14.600" cy="10.800" r="2.200" fill="#F97316" />
            <Circle cx="12.700" cy="15.200" r="2.300" fill="#EF4444" />
            <Circle cx="9.200" cy="15.300" r="1.100" fill="#FBBF24" />
          </>
        );
      case 'snack': // maçã vermelha com folha
        return (
          <>
            <Path d="M12 8.300c-2.400-1.800-6.600-1-6.600 3.900 0 4.400 2.800 8.800 6.600 8.800s6.600-4.400 6.600-8.800c0-4.900-4.200-5.700-6.600-3.900z" fill="#EF4444" />
            <Path d="M8.200 11.200c.3-1.500 1.300-2.300 2.500-2.500" stroke="#FCA5A5" strokeWidth={1.4} strokeLinecap="round" fill="none" />
            <Path d="M12 8.300V5.600" stroke="#92400E" strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M12.300 6.400c0-2.300 1.200-3.800 3.500-4.200 0 2.300-1.200 3.800-3.500 4.200z" fill="#22C55E" />
          </>
        );
      default: // jantar: lua dourada e estrelas
        return (
          <>
            <Path d="M20 14.800A8.200 8.200 0 1 1 9.300 3.900a6.600 6.600 0 0 0 10.700 10.900z" fill="#FBBF24" />
            <Circle cx="18" cy="6" r="1.200" fill="#FFFFFF" />
            <Circle cx="21.200" cy="10" r="0.900" fill="#FFFFFF" />
            <Circle cx="14.800" cy="3.200" r="0.800" fill="#FFFFFF" />
          </>
        );
    }
  }, [type]);

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

const BADGE_BG: Record<MealType, string> = {
  breakfast: '#FFF1D6',
  lunch: '#E3F5E5',
  snack: '#FFE4E4',
  dinner: '#3730A3',
};

/** Emblema quadrado e colorido com o ícone da refeição. */
export function MealIcon({ type, size = 36 }: { type: MealType; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size <= 32 ? radius.sm : radius.md, backgroundColor: BADGE_BG[type], alignItems: 'center', justifyContent: 'center' }}
    >
      <MealGlyph type={type} size={size * 0.68} />
    </View>
  );
}
