import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';

interface Props {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

/** Botão "Continuar com Google" + separador "ou". */
export function GoogleButton({ onPress, loading, disabled, title = 'Continuar com Google' }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.or}>ou</Text>
        <View style={styles.line} />
      </View>
      <Pressable
        onPress={onPress}
        disabled={loading || disabled}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, (loading || disabled) && styles.inactive, pressed && styles.pressed]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <FontAwesome name="google" size={20} color="#DB4437" />
            <Text style={styles.text}>{title}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  or: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  button: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...shadow,
  },
  inactive: { opacity: 0.7 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  text: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
