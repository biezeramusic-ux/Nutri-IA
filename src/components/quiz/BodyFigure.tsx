import Svg, { Ellipse, Path } from 'react-native-svg';
import type { Sex } from '../../types';

/** Fase da vida pelo desenho: muda a proporção da cabeça e a postura. */
export const lifeStage = (age: number): 'child' | 'teen' | 'adult' | 'senior' => (age < 13 ? 'child' : age < 20 ? 'teen' : age < 60 ? 'adult' : 'senior');

const MALE_BODY =
  'M22 52 Q30 44 44 46 L56 46 Q70 44 78 52 Q85 58 84 76 L86 118 Q86 125 80 125 L77 125 Q73 125 73 118 L72 86 L72 132 Q72 140 70 148 L30 148 Q28 140 28 132 L28 86 L27 118 Q27 125 23 125 L20 125 Q14 125 14 118 L16 76 Q15 58 22 52 Z';
const MALE_LEGS = 'M30 146 L49 146 L48 249 Q48 257 42 257 L36 257 Q30 257 31 249 Z M51 146 L70 146 L69 249 Q70 257 64 257 L58 257 Q52 257 52 249 Z';
const FEMALE_BODY =
  'M29 52 Q35 46 44 46 L56 46 Q65 46 71 52 Q77 58 76 76 L79 116 Q79 123 75 123 L72 123 Q68 123 68 117 L66 88 Q66 102 70 114 Q80 130 83 156 L17 156 Q20 130 30 114 Q34 102 34 88 L32 117 Q32 123 28 123 L25 123 Q21 123 21 116 L24 76 Q23 58 29 52 Z';
const FEMALE_LEGS = 'M34 154 L49 154 L48 249 Q48 257 42 257 L37 257 Q32 257 33 249 Z M51 154 L66 154 L67 249 Q68 257 63 257 L58 257 Q52 257 52 249 Z';
const LONG_HAIR = 'M35 20 Q34 2 50 2 Q66 2 65 20 L68 52 Q60 56 50 54 Q40 56 32 52 Z';

/**
 * Silhueta humana de uma só cor (use com opacidade para ficar transparente). `h` é a altura em pixels.
 * A mulher tem cabelo comprido, cintura e vestido; o homem, ombros largos e calças. Crianças têm cabeça maior.
 */
export function BodyFigure({ sex, age, h, color }: { sex: Sex; age: number; h: number; color: string; hair?: string; skin?: string }) {
  const stage = lifeStage(age);
  const w = (h * 100) / 262;
  const kid = stage === 'child';
  return (
    <Svg width={w} height={h} viewBox="0 0 100 262">
      {sex === 'female' && !kid && <Path d={LONG_HAIR} fill={color} />}
      <Ellipse cx={50} cy={kid ? 24 : 21} rx={kid ? 17 : 13.5} ry={kid ? 20 : 16.5} fill={color} />
      <Path d="M44 34 L56 34 L57 48 L43 48 Z" fill={color} />
      <Path d={sex === 'female' ? FEMALE_BODY : MALE_BODY} fill={color} />
      <Path d={sex === 'female' ? FEMALE_LEGS : MALE_LEGS} fill={color} />
    </Svg>
  );
}
