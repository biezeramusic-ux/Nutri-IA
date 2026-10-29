import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { Sex } from '../../types';

/** Fase da vida pelo desenho: muda a proporção da cabeça, o cabelo e a postura. */
export const lifeStage = (age: number): 'child' | 'teen' | 'adult' | 'senior' => (age < 13 ? 'child' : age < 20 ? 'teen' : age < 60 ? 'adult' : 'senior');

/**
 * Boneco que muda com o sexo, a idade e a altura. `h` é a altura do desenho em pixels (cabeça aos pés).
 * Mulher: vestido e cabelo comprido. Homem: calças e ombros mais largos. Crianças têm cabeça maior; idosos têm cabelo grisalho.
 */
export function BodyFigure({ sex, age, h, color, hair, skin = '#F2C9A5' }: { sex: Sex; age: number; h: number; color: string; hair?: string; skin?: string }) {
  const stage = lifeStage(age);
  const headR = h * (stage === 'child' ? 0.12 : stage === 'teen' ? 0.1 : 0.085);
  const w = h * 0.6;
  const cx = w / 2;
  const neck = headR * 2 + h * 0.02;
  const kid = stage === 'child' ? 0.82 : 1;
  const shoulder = h * (sex === 'male' ? 0.19 : 0.16) * kid;
  const torsoH = (h - neck) * 0.36;
  const bottom = sex === 'female' ? neck + torsoH * 1.35 : neck + torsoH;
  const hip = sex === 'female' ? shoulder * 1.45 : shoulder * 0.85;
  const legW = h * 0.07 * kid;
  const hairColor = hair ?? (stage === 'senior' ? '#CBD5E1' : '#3B2A20');
  const arm = h * 0.05 * kid;
  const pants = '#334155';
  const handY = neck + torsoH * 0.95;
  const legTop = sex === 'female' ? bottom : bottom - 6;
  const elbow = shoulder + arm * 0.7;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* pescoço */}
      <Rect x={cx - headR * 0.35} y={headR * 1.8} width={headR * 0.7} height={neck - headR * 1.6} fill={skin} />
      {/* pernas */}
      <Rect x={cx - legW - 1.5} y={legTop} width={legW} height={h - legTop - 4} rx={legW / 3} fill={sex === 'male' ? pants : skin} />
      <Rect x={cx + 1.5} y={legTop} width={legW} height={h - legTop - 4} rx={legW / 3} fill={sex === 'male' ? pants : skin} />
      {/* sapatos */}
      <Rect x={cx - legW - 3} y={h - 7} width={legW + 3} height={7} rx={3} fill="#1F2937" />
      <Rect x={cx} y={h - 7} width={legW + 3} height={7} rx={3} fill="#1F2937" />
      {/* braços */}
      <Path d={`M ${cx - shoulder + 2} ${neck + 4} L ${cx - elbow} ${handY}`} stroke={skin} strokeWidth={arm} strokeLinecap="round" />
      <Path d={`M ${cx + shoulder - 2} ${neck + 4} L ${cx + elbow} ${handY}`} stroke={skin} strokeWidth={arm} strokeLinecap="round" />
      {/* tronco / vestido */}
      <Path d={`M ${cx - shoulder} ${neck + 6} Q ${cx - shoulder} ${neck - 2} ${cx - shoulder * 0.45} ${neck - 2} L ${cx + shoulder * 0.45} ${neck - 2} Q ${cx + shoulder} ${neck - 2} ${cx + shoulder} ${neck + 6} L ${cx + hip} ${bottom} L ${cx - hip} ${bottom} Z`} fill={color} />
      {/* cabelo atrás (mulher) */}
      {sex === 'female' && stage !== 'child' && <Path d={`M ${cx - headR} ${headR} Q ${cx - headR * 1.25} ${headR * 2.8} ${cx - headR * 0.6} ${headR * 3.1} L ${cx + headR * 0.6} ${headR * 3.1} Q ${cx + headR * 1.25} ${headR * 2.8} ${cx + headR} ${headR} Z`} fill={hairColor} />}
      {/* cabeça */}
      <G>
        <Circle cx={cx} cy={headR} r={headR} fill={skin} />
        <Path d={`M ${cx - headR} ${headR} A ${headR} ${headR} 0 0 1 ${cx + headR} ${headR} Q ${cx} ${headR * 0.35} ${cx - headR} ${headR} Z`} fill={hairColor} />
        <Circle cx={cx - headR * 0.35} cy={headR * 1.05} r={headR * 0.08} fill="#1F2937" />
        <Circle cx={cx + headR * 0.35} cy={headR * 1.05} r={headR * 0.08} fill="#1F2937" />
        <Path d={`M ${cx - headR * 0.3} ${headR * 1.4} Q ${cx} ${headR * 1.6} ${cx + headR * 0.3} ${headR * 1.4}`} stroke="#1F2937" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      </G>
      {stage === 'senior' && <Path d={`M ${cx + elbow + arm * 0.6} ${handY} L ${cx + elbow + arm * 0.8} ${h - 2}`} stroke="#92400E" strokeWidth={3} strokeLinecap="round" />}
    </Svg>
  );
}
