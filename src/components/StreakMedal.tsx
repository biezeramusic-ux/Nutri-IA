import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Stop, Text as SvgText } from 'react-native-svg';

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

const CX = 24;
const CY = 29;

function polygon(sides: number, r: number, rot = -90): string {
  return Array.from({ length: sides }, (_, i) => {
    const a = ((rot + (360 / sides) * i) * Math.PI) / 180;
    return `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

function burst(points: number, outer: number, inner: number): string {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((-90 + (180 / points) * i) * Math.PI) / 180;
    return `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

/** Cada nível tem um desenho próprio (forma e enfeites), não só outra cor. */
export function StreakMedal({ size, tier, value }: { size: number; tier: MedalTier; value: number }) {
  const idx = MEDAL_TIERS.indexOf(tier);
  const label = String(value);
  const fs = label.length >= 3 ? 14 : label.length === 2 ? 17 : 20;
  const gid = `m${tier.rim.slice(1)}`;
  const fill = `url(#${gid})`;
  const stroke = { stroke: tier.rim, strokeWidth: 1.8, strokeLinejoin: 'round' as const };

  let shape;
  let behind = null;
  let above = null;
  switch (idx) {
    case 0: // bronze: círculo com fita
      behind = (
        <>
          <Path d="M14 2 L24 22 L18 24 L9 6 Z" fill={tier.dark} />
          <Path d="M34 2 L24 22 L30 24 L39 6 Z" fill={tier.rim} />
        </>
      );
      shape = <Circle cx={CX} cy={CY} r={16} fill={fill} {...stroke} />;
      break;
    case 1: // prata: escudo
      shape = <Path d="M24 11 L38 16 V28 C38 37 30 42 24 45 C18 42 10 37 10 28 V16 Z" fill={fill} {...stroke} />;
      above = <Path d="M24 2 L26 6.5 L31 7 L27.3 10.2 L28.4 15 L24 12.5 L19.6 15 L20.7 10.2 L17 7 L22 6.5 Z" fill={tier.dark} stroke={tier.rim} strokeWidth={1} />;
      break;
    case 2: // ouro: estrela de 12 pontas com fita
      behind = (
        <>
          <Path d="M13 24 L9 46 L16 41 L21 46 L22 30 Z" fill={tier.dark} />
          <Path d="M35 24 L39 46 L32 41 L27 46 L26 30 Z" fill={tier.rim} />
        </>
      );
      shape = <Polygon points={burst(12, 20, 16.5)} fill={fill} {...stroke} />;
      break;
    case 3: // platina: hexágono com coroa
      shape = <Polygon points={polygon(6, 17)} fill={fill} {...stroke} />;
      above = <Path d="M14 9 L17 3 L21 7.5 L24 1.5 L27 7.5 L31 3 L34 9 Z" fill="#FDE68A" stroke="#B45309" strokeWidth={1.2} strokeLinejoin="round" />;
      break;
    case 4: // ametista: pedra facetada com brilhos
      behind = (
        <>
          <Path d="M6 18 L7.2 21.4 L10.6 22.6 L7.2 23.8 L6 27.2 L4.8 23.8 L1.4 22.6 L4.8 21.4 Z" fill={tier.dark} />
          <Path d="M42 18 L43.2 21.4 L46.6 22.6 L43.2 23.8 L42 27.2 L40.8 23.8 L37.4 22.6 L40.8 21.4 Z" fill={tier.dark} />
        </>
      );
      shape = (
        <>
          <Polygon points={polygon(8, 17, -67.5)} fill={fill} {...stroke} />
          <Polygon points={polygon(8, 10, -67.5)} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.1} />
        </>
      );
      break;
    default: // diamante: losango com brilhos e coroa
      shape = (
        <>
          <Path d="M24 9 L40 24 L24 47 L8 24 Z" fill={fill} {...stroke} />
          <Path d="M8 24 H40 M24 9 L18 24 L24 47 M24 9 L30 24 L24 47" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.1} fill="none" />
        </>
      );
      above = (
        <>
          <Path d="M17 7 L19 2 L22 5.5 L24 1 L26 5.5 L29 2 L31 7 Z" fill="#FDE68A" stroke="#B45309" strokeWidth={1} strokeLinejoin="round" />
          <Path d="M43 12 L44.2 15 L47 16 L44.2 17 L43 20 L41.8 17 L39 16 L41.8 15 Z" fill="#FBBF24" />
          <Path d="M5 30 L5.8 32 L8 32.8 L5.8 33.6 L5 36 L4.2 33.6 L2 32.8 L4.2 32 Z" fill="#FBBF24" />
        </>
      );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={tier.light} />
          <Stop offset="1" stopColor={tier.dark} />
        </LinearGradient>
      </Defs>
      {behind}
      {shape}
      {above}
      <SvgText x={CX} y={CY + fs * 0.36} fontSize={fs} fontWeight="800" fill={tier.rim} textAnchor="middle">
        {label}
      </SvgText>
    </Svg>
  );
}
