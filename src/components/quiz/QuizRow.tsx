import { useMemo } from 'react';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Caixa quadrada (várias escolhas) ou círculo (uma só). */
  multi?: boolean;
}

/** Linha de resposta do quiz: fundo suave, texto forte e caixa de seleção à direita. */
export function QuizRow({ title, subtitle, selected, onPress, multi = false }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [styles.row, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.box, multi ? styles.square : styles.circle, selected && styles.boxOn]}>
        {selected && <Check size={14} color={colors.background} strokeWidth={3.5} />}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 64,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    selected: { borderColor: colors.text, backgroundColor: colors.card },
    pressed: { opacity: 0.85 },
    text: { flex: 1 },
    title: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
    box: { width: 24, height: 24, borderWidth: 2, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
    square: { borderRadius: 6 },
    circle: { borderRadius: 12 },
    boxOn: { backgroundColor: colors.text, borderColor: colors.text },
  });
