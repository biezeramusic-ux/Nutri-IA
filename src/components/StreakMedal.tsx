import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

export interface MedalTier {
  name: string;
  light: string;
  dark: string;
  rim: string;
}

/** Medalhas do Nutri IA: cada conquista da sequência (3, 7, 14, 30, 60 e 100 dias) tem o seu símbolo de saúde. */
export const MEDAL_TIERS: MedalTier[] = [
  { name: 'Medalha Broto', light: '#BBF7D0', dark: '#22C55E', rim: '#166534' },
  { name: 'Medalha Maçã', light: '#FECACA', dark: '#EF4444', rim: '#991B1B' },
  { name: 'Medalha Abacate', light: '#ECFCCB', dark: '#84CC16', rim: '#3F6212' },
  { name: 'Medalha Gota', light: '#BAE6FD', dark: '#38BDF8', rim: '#0369A1' },
  { name: 'Medalha Coração', light: '#FBCFE8', dark: '#F472B6', rim: '#9D174D' },
  { name: 'Medalha Coroa', light: '#FDE68A', dark: '#F59E0B', rim: '#B45309' },
];

const TEXT_Y = [31, 32, 30, 34, 27, 30];

/** Medalha desenhada (vetor): um símbolo por nível e o número da sequência no centro. */
export function StreakMedal({ size, tier, value }: { size: number; tier: MedalTier; value: number }) {
  const idx = MEDAL_TIERS.indexOf(tier);
  const label = String(value);
  const fs = label.length >= 3 ? 14 : label.length === 2 ? 17 : 20;
  const gid = `m${tier.rim.slice(1)}`;
  const fill = `url(#${gid})`;
  const stroke = { stroke: tier.rim, strokeWidth: 1.8, strokeLinejoin: 'round' as const };
  const leaf = { fill: '#4ADE80', stroke: '#166534', strokeWidth: 1.2, strokeLinejoin: 'round' as const };

  let shape;
  let extra = null;
  switch (idx) {
    case 0: // broto: círculo com folhas a nascer
      shape = <Circle cx={24} cy={30} r={15} fill={fill} {...stroke} />;
      extra = (
        <>
          <Path d="M24 15 C20 9 14 9 11 11 C12 17 18 19 24 15 Z" {...leaf} />
          <Path d="M24 15 C28 7 34 7 37 9 C36 16 30 18 24 15 Z" {...leaf} />
        </>
      );
      break;
    case 1: // maçã
      shape = <Path d="M24 15 C20 11 9 12 9 25 C9 37 17 46 24 43 C31 46 39 37 39 25 C39 12 28 11 24 15 Z" fill={fill} {...stroke} />;
      extra = (
        <>
          <Path d="M24 15 C24 10 25 7 27 4" stroke="#78350F" strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M26 9 C30 3 36 4 37 5 C35 10 30 11 26 9 Z" {...leaf} />
        </>
      );
      break;
    case 2: // abacate
      shape = <Path d="M24 6 C30 6 33 13 34 21 C38 27 39 33 37 39 C34 46 14 46 11 39 C9 33 10 27 14 21 C15 13 18 6 24 6 Z" fill={fill} {...stroke} />;
      extra = <Path d="M24 11 C28 11 30 17 31 22 C34 27 35 32 33 37 C31 42 17 42 15 37 C13 32 14 27 17 22 C18 17 20 11 24 11 Z" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.2} />;
      break;
    case 3: // gota de água
      shape = <Path d="M24 3 C24 3 39 20 39 32 C39 40 32.5 46 24 46 C15.5 46 9 40 9 32 C9 20 24 3 24 3 Z" fill={fill} {...stroke} />;
      extra = <Path d="M15 32 C15 26 18 22 21 18" stroke="#fff" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" fill="none" />;
      break;
    case 4: // coração
      shape = <Path d="M24 45 C10 35 5 27 5 19 C5 13 9 9 15 9 C19 9 22 11 24 14 C26 11 29 9 33 9 C39 9 43 13 43 19 C43 27 38 35 24 45 Z" fill={fill} {...stroke} />;
      extra = <Path d="M11 18 C11 15 13 13 16 13" stroke="#fff" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" fill="none" />;
      break;
    default: // coroa Nutri IA: coroa sobre círculo rodeado de louros
      shape = <Circle cx={24} cy={30} r={13} fill={fill} {...stroke} />;
      extra = (
        <>
          {[-70, -35, 0, 35].map((a, i) => (
            <Ellipse key={`l${i}`} cx={9 + i * 1.2} cy={36 - i * 7} rx={2.4} ry={5} rotation={a + 20} origin={`${9 + i * 1.2}, ${36 - i * 7}`} fill="#4ADE80" stroke="#166534" strokeWidth={0.9} />
          ))}
          {[-70, -35, 0, 35].map((a, i) => (
            <Ellipse key={`r${i}`} cx={39 - i * 1.2} cy={36 - i * 7} rx={2.4} ry={5} rotation={-a - 20} origin={`${39 - i * 1.2}, ${36 - i * 7}`} fill="#4ADE80" stroke="#166534" strokeWidth={0.9} />
          ))}
          <Path d="M15 12 L17.5 4 L21 9 L24 2 L27 9 L30.5 4 L33 12 Z" fill="#FDE68A" stroke="#B45309" strokeWidth={1.2} strokeLinejoin="round" />
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
      {shape}
      {extra}
      <SvgText x={24} y={TEXT_Y[idx] + fs * 0.36} fontSize={fs} fontWeight="800" fill={tier.rim} textAnchor="middle">
        {label}
      </SvgText>
    </Svg>
  );
}
