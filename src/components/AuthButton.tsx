import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** Botão principal em Verde Saúde, com estado de carregamento. */
export function AuthButton({ title, onPress, loading, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inactive = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, inactive && styles.inactive, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  button: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { opacity: 0.65 },
  pressed: { opacity: 0.9 },
  text: { color: '#fff', fontSize: font.h3, fontWeight: '600' },
});
