import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function QuizChip({ label, selected, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]} accessibilityRole="button">
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  text: { fontSize: font.body, fontWeight: '500', color: colors.text },
  textSelected: { color: colors.primaryDark, fontWeight: '600' },
});
