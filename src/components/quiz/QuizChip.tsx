import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius } from '../../constants/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function QuizChip({ label, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]} accessibilityRole="button">
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#F6FBF6' },
  text: { fontSize: font.body, fontWeight: '500', color: colors.text },
  textSelected: { color: colors.primaryDark, fontWeight: '600' },
});
