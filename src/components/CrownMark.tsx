import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Coroa desenhada (vetor, sem emoji), pequena, para ficar junto ao título. */
export function CrownMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size * 1.4} height={size} viewBox="0 0 28 20">
      <Defs>
        <LinearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Path d="M2 6 L8 11 L14 2 L20 11 L26 6 L24 17 H4 Z" fill="url(#crownGold)" stroke="#D97706" strokeWidth={1} strokeLinejoin="round" />
      <Rect x="4" y="17.5" width="20" height="2" rx="1" fill="#D97706" />
      <Circle cx="2" cy="6" r="1.6" fill="#FBBF24" stroke="#D97706" strokeWidth={0.8} />
      <Circle cx="14" cy="2" r="1.6" fill="#FBBF24" stroke="#D97706" strokeWidth={0.8} />
      <Circle cx="26" cy="6" r="1.6" fill="#FBBF24" stroke="#D97706" strokeWidth={0.8} />
    </Svg>
  );
}
