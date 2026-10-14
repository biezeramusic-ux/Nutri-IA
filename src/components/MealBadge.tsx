import { Text, View } from 'react-native';
import { radius } from '../constants/theme';
import type { MealType } from '../types';

const STYLE: Record<MealType, { bg: string; emoji: string }> = {
  breakfast: { bg: '#FFF1D6', emoji: '🥐' },
  lunch: { bg: '#E3F5E5', emoji: '🍲' },
  snack: { bg: '#FFE4E4', emoji: '🍎' },
  dinner: { bg: '#E4E6FF', emoji: '🌙' },
};

/** Emblema colorido de cada refeição (cada uma com a sua cor), com o emoji de identificação. */
export function MealBadge({ type, size = 40 }: { type: MealType; size?: number }) {
  const s = STYLE[type];
  return (
    <View style={{ width: size, height: size, borderRadius: size <= 32 ? radius.sm : radius.md, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.52 }}>{s.emoji}</Text>
    </View>
  );
}
