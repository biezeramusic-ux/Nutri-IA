import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, font, radius } from '../constants/theme';

interface Props {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

/** Logótipo "G" do Google (4 cores). */
function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <Path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z" />
      <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </Svg>
  );
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
            <GoogleG />
            <Text style={styles.text}>{title}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  or: { color: colors.textMuted, fontSize: font.small },
  button: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  inactive: { opacity: 0.65 },
  pressed: { opacity: 0.9 },
  text: { color: colors.text, fontSize: font.body, fontWeight: '600' },
});
