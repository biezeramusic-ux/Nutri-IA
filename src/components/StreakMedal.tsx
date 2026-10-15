import type { ReactNode } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, Stop, Text as SvgText } from 'react-native-svg';

export interface MedalTier {
  name: string;
  /** Cores do metal (claro → escuro), do aro e da fita. */
  light: string;
  dark: string;
  rim: string;
  ribbonA: string;
  ribbonB: string;
}

/** Colecção de medalhas: cada conquista (3, 7, 14, 30, 60 e 100 dias) tem metal, borda, fita e enfeites próprios. */
export const MEDAL_TIERS: MedalTier[] = [
  { name: 'Medalha Bronze', light: '#F0B27A', dark: '#B8692F', rim: '#7A3E14', ribbonA: '#2F6B4F', ribbonB: '#1E4A36' },
  { name: 'Medalha Prata', light: '#F8FAFC', dark: '#A9B4C2', rim: '#5F6B7A', ribbonA: '#2B4A7A', ribbonB: '#1B3358' },
  { name: 'Medalha Ouro', light: '#FFF1A8', dark: '#EAB308', rim: '#8A5A00', ribbonA: '#B3262E', ribbonB: '#7F1820' },
  { name: 'Medalha Platina', light: '#F1F9FF', dark: '#8EC5E8', rim: '#35607F', ribbonA: '#0F766E', ribbonB: '#0A5650' },
  { name: 'Medalha Ametista', light: '#EDE4FF', dark: '#9F7AEA', rim: '#4C2A8C', ribbonA: '#5B21B6', ribbonB: '#3F1685' },
  { name: 'Medalha Diamante', light: '#FFFFFF', dark: '#7DD3FC', rim: '#0E5E8A', ribbonA: '#111827', ribbonB: '#030712' },
];

const CX = 24;
const CY = 29;

const star = (cx: number, cy: number, r: number): string => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
};

const ring = (points: number, outer: number, inner: number, rot = -90): string =>
  Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rot + (180 / points) * i) * Math.PI) / 180;
    return `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

const regular = (sides: number, r: number, rot = -90): string =>
  Array.from({ length: sides }, (_, i) => {
    const a = ((rot + (360 / sides) * i) * Math.PI) / 180;
    return `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

/** Ramo de louro: folhas ao longo de um arco, de baixo para cima, de cada lado do disco. */
function Laurel({ color, stroke, count = 5, radius = 17.5 }: { color: string; stroke: string; count?: number; radius?: number }) {
  const leaves: ReactNode[] = [];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < count; i++) {
      const left = 118 + i * (100 / (count - 1)); // da base até ao lado do disco
      const deg = side === 0 ? left : 180 - left;
      const rad = (deg * Math.PI) / 180;
      const x = CX + radius * Math.cos(rad);
      const y = CY + radius * Math.sin(rad);
      leaves.push(<Ellipse key={`${side}-${i}`} cx={x} cy={y} rx={2} ry={4.2} rotation={deg + (side === 0 ? -25 : 25)} origin={`${x}, ${y}`} fill={color} stroke={stroke} strokeWidth={0.7} />);
    }
  }
  return <G>{leaves}</G>;
}

export function StreakMedal({ size, tier, value }: { size: number; tier: MedalTier; value: number }) {
  const idx = MEDAL_TIERS.indexOf(tier);
  const label = String(value);
  const fs = label.length >= 3 ? 13 : label.length === 2 ? 16 : 19;
  const gid = `g${tier.rim.slice(1)}`;
  const metal = `url(#${gid})`;
  const edge = { stroke: tier.rim, strokeWidth: 1.4, strokeLinejoin: 'round' as const };

  let disc: ReactNode;
  let before: ReactNode = null;
  let after: ReactNode = null;
  switch (idx) {
    case 0: // bronze: disco liso com aro interior
      disc = (
        <>
          <Circle cx={CX} cy={CY} r={15} fill={metal} {...edge} />
          <Circle cx={CX} cy={CY} r={11.5} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={1} />
        </>
      );
      break;
    case 1: // prata: borda serrilhada (moeda) e uma estrela
      disc = (
        <>
          <Polygon points={ring(28, 16.5, 15)} fill={metal} {...edge} />
          <Circle cx={CX} cy={CY} r={11.5} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1} strokeDasharray="1.6 1.6" />
        </>
      );
      after = <Path d={star(CX, CY + 8.2, 2.6)} fill={tier.rim} />;
      break;
    case 2: // ouro: ramos de louro e aro duplo
      before = <Laurel color="#86C06C" stroke="#3F6B2C" />;
      disc = (
        <>
          <Circle cx={CX} cy={CY} r={13.5} fill={metal} {...edge} />
          <Circle cx={CX} cy={CY} r={10.5} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={0.9} />
        </>
      );
      break;
    case 3: // platina: hexágono com aro e três estrelas
      disc = (
        <>
          <Polygon points={regular(6, 16.5)} fill={metal} {...edge} />
          <Polygon points={regular(6, 12.5)} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={1} />
        </>
      );
      after = (
        <>
          <Path d={star(CX - 6.5, CY + 9, 2)} fill={tier.rim} />
          <Path d={star(CX, CY + 10.4, 2.4)} fill={tier.rim} />
          <Path d={star(CX + 6.5, CY + 9, 2)} fill={tier.rim} />
        </>
      );
      break;
    case 4: // ametista: pedra facetada com asas
      before = (
        <>
          <Path d="M9 27 C3 27 1 21 2 15 C6 17 10 20 12 25 Z" fill={tier.dark} stroke={tier.rim} strokeWidth={0.9} />
          <Path d="M7 29 C2 31 1 36 3 40 C7 38 10 35 12 31 Z" fill={tier.dark} stroke={tier.rim} strokeWidth={0.9} />
          <Path d="M39 27 C45 27 47 21 46 15 C42 17 38 20 36 25 Z" fill={tier.dark} stroke={tier.rim} strokeWidth={0.9} />
          <Path d="M41 29 C46 31 47 36 45 40 C41 38 38 35 36 31 Z" fill={tier.dark} stroke={tier.rim} strokeWidth={0.9} />
        </>
      );
      disc = (
        <>
          <Polygon points={regular(8, 16.5, -67.5)} fill={metal} {...edge} />
          <Polygon points={regular(8, 12, -67.5)} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={1} />
          <Path d={`M${CX} ${CY - 12} L${CX} ${CY + 12} M${CX - 12} ${CY} L${CX + 12} ${CY}`} stroke="#fff" strokeOpacity={0.22} strokeWidth={0.8} />
        </>
      );
      break;
    default: // diamante: coroa, louros, borda dentada e brilhos
      before = <Laurel color="#9BD3EF" stroke="#0E5E8A" radius={17.8} />;
      disc = (
        <>
          <Polygon points={ring(16, 15.5, 13)} fill={metal} {...edge} />
          <Circle cx={CX} cy={CY} r={10.5} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={1} />
        </>
      );
      after = (
        <>
          <Path d="M17 14 L18.5 8.5 L21.5 12 L24 6.5 L26.5 12 L29.5 8.5 L31 14 Z" fill="#FBD34D" stroke="#8A5A00" strokeWidth={1} strokeLinejoin="round" />
          <Path d="M41 8 L42 10.5 L44.5 11.5 L42 12.5 L41 15 L40 12.5 L37.5 11.5 L40 10.5 Z" fill="#fff" stroke="#7DD3FC" strokeWidth={0.5} />
          <Path d="M6 6 L6.8 8 L8.8 8.8 L6.8 9.6 L6 11.6 L5.2 9.6 L3.2 8.8 L5.2 8 Z" fill="#fff" stroke="#7DD3FC" strokeWidth={0.5} />
        </>
      );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={tier.light} />
          <Stop offset="0.55" stopColor={tier.dark} />
          <Stop offset="1" stopColor={tier.light} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>
      {/* fita */}
      <Path d="M13 1 H21 L27 20 H20 Z" fill={tier.ribbonA} />
      <Path d="M35 1 H27 L21 20 H28 Z" fill={tier.ribbonB} />
      {before}
      {disc}
      {after}
      <SvgText x={CX} y={CY + fs * 0.36 - (idx === 1 || idx === 3 ? 2 : 0)} fontSize={fs} fontWeight="800" fill={tier.rim} textAnchor="middle">
        {label}
      </SvgText>
    </Svg>
  );
}
