import Svg, { Circle, Path } from 'react-native-svg';

export type MacroKind = 'protein' | 'fats' | 'carbs';

/** Ícone desenhado de cada macro (carne, gota de azeite, espiga de trigo), em vez de emojis. */
export function MacroGlyph({ kind, color, size = 16 }: { kind: MacroKind; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'protein' && (
        <>
          {/* Coxa de frango: carne redonda e osso */}
          <Path d="M10.600 13.400l-5 5" stroke={color} strokeWidth={2.600} strokeLinecap="round" />
          <Circle cx="4.200" cy="19.800" r="1.900" fill={color} />
          <Circle cx="6.600" cy="21.200" r="1.700" fill={color} />
          <Circle cx="15" cy="9" r="7" fill={color} />
          <Path d="M11.500 6.400c1-1.400 2.600-1.900 4-1.600" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.600} strokeLinecap="round" fill="none" />
        </>
      )}
      {kind === 'fats' && (
        <>
          {/* Gota de azeite */}
          <Path d="M12 2.500c3.800 4.500 6.500 7.600 6.500 11.200a6.500 6.500 0 0 1-13 0C5.500 10.100 8.200 7 12 2.500z" fill={color} />
          <Path d="M8.800 14.200c.1 1.700 1.100 3 2.700 3.400" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.500} strokeLinecap="round" fill="none" />
        </>
      )}
      {kind === 'carbs' && (
        <>
          {/* Espiga de trigo */}
          <Path d="M12 22V8" stroke={color} strokeWidth={1.600} strokeLinecap="round" />
          <Path d="M12 2.200c1.700 1.300 2 3.200 0 5.300-2-2.100-1.700-4 0-5.300z" fill={color} />
          <Path d="M12 9.500c-3.200.2-4.700-1.600-4.700-4.200 3.200-.2 4.700 1.600 4.700 4.200z" fill={color} />
          <Path d="M12 9.500c3.200.2 4.700-1.600 4.700-4.200-3.200-.2-4.700 1.600-4.700 4.200z" fill={color} />
          <Path d="M12 15c-3.200.2-4.700-1.600-4.700-4.200 3.200-.2 4.700 1.600 4.700 4.200z" fill={color} />
          <Path d="M12 15c3.200.2 4.700-1.600 4.700-4.200-3.200-.2-4.700 1.600-4.700 4.200z" fill={color} />
          <Path d="M12 20.500c-3.200.2-4.700-1.600-4.700-4.200 3.200-.2 4.700 1.600 4.700 4.200z" fill={color} />
          <Path d="M12 20.500c3.200.2 4.700-1.600 4.700-4.200-3.200-.2-4.700 1.600-4.700 4.200z" fill={color} />
        </>
      )}
    </Svg>
  );
}
