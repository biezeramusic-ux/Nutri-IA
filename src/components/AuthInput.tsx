import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { forwardRef, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { Text } from '../components/AppText';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props extends TextInputProps {
  label: string;
  icon: LucideIcon;
  error?: string | null;
  /** Mostra o botão de mostrar/ocultar (use com secureTextEntry). */
  passwordToggle?: boolean;
}

export const AuthInput = forwardRef<TextInput, Props>(function AuthInput(
  { label, icon: Icon, error, passwordToggle, secureTextEntry, style, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [hidden, setHidden] = useState(true);
  const secure = passwordToggle ? hidden : secureTextEntry;
  const ToggleIcon = hidden ? EyeOff : Eye;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <Icon size={18} color={error ? colors.danger : colors.textFaint} />
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
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
            <ToggleIcon size={18} color={colors.textFaint} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: font.small, fontWeight: '500', color: colors.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, fontSize: font.body, color: colors.text, paddingVertical: 0 },
  error: { fontSize: font.small, color: colors.danger },
});
