import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';

interface Props extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  /** Mostra o botão de mostrar/ocultar (use com secureTextEntry). */
  passwordToggle?: boolean;
}

export const AuthInput = forwardRef<TextInput, Props>(function AuthInput(
  { label, icon, error, passwordToggle, secureTextEntry, style, ...rest },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const secure = passwordToggle ? hidden : secureTextEntry;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <Ionicons name={icon} size={20} color={error ? colors.danger : colors.textMuted} />
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          secureTextEntry={secure}
          {...rest}
        />
        {passwordToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
          >
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow,
  },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, fontSize: 15, color: colors.text },
  error: { fontSize: 12, color: colors.danger, marginLeft: 12 },
});
