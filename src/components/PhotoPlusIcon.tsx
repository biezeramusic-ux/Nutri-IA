import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Ícone de fotografias com "+" (duas fotos sobrepostas, montanhas e sol), desenhado só com linhas para ser branco e nítido. */
export function PhotoPlusIcon({ size = 44, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M10 20 L24 15" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M10 20 Q8 21 9 24 L19 50 Q20 53 23 52 L30 49.5" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={22} y={14} width={30} height={34} rx={5} stroke={color} strokeWidth={3.2} />
      <Circle cx={31} cy={24} r={3.6} stroke={color} strokeWidth={3} />
      <Path d="M25 42 L33 33 L38 38 L43 31 L49 38" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={47} cy={46} r={11} fill="#2E9E4F" stroke={color} strokeWidth={3.2} />
      <Path d="M47 41 V51 M42 46 H52" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
    </Svg>
  );
}
