import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius } from '../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** Botão principal em Verde Saúde, com estado de carregamento. */
export function AuthButton({ title, onPress, loading, disabled }: Props) {
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

const styles = StyleSheet.create({
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
