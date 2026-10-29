import { useMemo, type ReactNode } from 'react';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { Reveal } from './Reveal';

interface Props {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Caixa quadrada (várias escolhas) ou círculo (uma só). */
  multi?: boolean;
  /** Ícone numa bolha à esquerda (opcional). */
  icon?: ReactNode;
}

/** Linha de resposta do quiz: fundo suave, texto forte e caixa de seleção à direita. */
export function QuizRow({ title, subtitle, selected, onPress, multi = false, icon }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Reveal>
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [styles.row, selected && styles.selected, pressed && styles.pressed]}
    >
      {!!icon && <View style={[styles.bubble, selected && { backgroundColor: colors.card }]}>{icon}</View>}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.box, multi ? styles.square : styles.circle, selected && styles.boxOn]}>
        {selected && <Check size={14} color="#fff" strokeWidth={3.5} />}
      </View>
    </Pressable>
    </Reveal>
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
    selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    pressed: { opacity: 0.85 },
    bubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1 },
    title: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
    box: { width: 24, height: 24, borderWidth: 2, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
    square: { borderRadius: 6 },
    circle: { borderRadius: 12 },
    boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  });
