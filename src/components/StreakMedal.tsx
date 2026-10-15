import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

export interface MedalTier {
  name: string;
  light: string;
  dark: string;
  rim: string;
}

/** Uma medalha por conquista da sequência (3, 7, 14, 30, 60 e 100 dias). */
export const MEDAL_TIERS: MedalTier[] = [
  { name: 'Medalha de bronze', light: '#F2B27A', dark: '#B8692F', rim: '#8A4A1E' },
  { name: 'Medalha de prata', light: '#F1F5F9', dark: '#94A3B8', rim: '#64748B' },
  { name: 'Medalha de ouro', light: '#FDE68A', dark: '#F59E0B', rim: '#B45309' },
  { name: 'Medalha de platina', light: '#BAE6FD', dark: '#38BDF8', rim: '#0369A1' },
  { name: 'Medalha de ametista', light: '#DDD6FE', dark: '#8B5CF6', rim: '#5B21B6' },
  { name: 'Medalha de diamante', light: '#A7F3D0', dark: '#10B981', rim: '#047857' },
];

/** Medalha desenhada (vetor) com o número da sequência no centro. */
export function StreakMedal({ size, tier, value }: { size: number; tier: MedalTier; value: number }) {
  const label = String(value);
  const fs = label.length >= 3 ? 15 : label.length === 2 ? 18 : 21;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id={`m${tier.rim.slice(1)}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={tier.light} />
          <Stop offset="1" stopColor={tier.dark} />
        </LinearGradient>
      </Defs>
      <Path d="M14 2 L24 22 L18 24 L9 6 Z" fill={tier.dark} opacity={0.85} />
      <Path d="M34 2 L24 22 L30 24 L39 6 Z" fill={tier.rim} opacity={0.85} />
      <Circle cx="24" cy="29" r="16" fill={`url(#m${tier.rim.slice(1)})`} stroke={tier.rim} strokeWidth={1.8} />
      <Circle cx="24" cy="29" r="12" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.2} />
      <SvgText x="24" y={29 + fs * 0.36} fontSize={fs} fontWeight="800" fill={tier.rim} textAnchor="middle">
        {label}
      </SvgText>
    </Svg>
  );
}
