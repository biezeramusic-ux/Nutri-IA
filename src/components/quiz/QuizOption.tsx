import { Check, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, font, radius } from '../../constants/theme';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}

/** Cartão de resposta do quiz. */
export function QuizOption({ icon: Icon, title, subtitle, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={[styles.icon, selected && styles.iconSelected]}>
        <Icon size={20} color={selected ? '#fff' : colors.limeDark} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Check size={14} color="#fff" strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardBase,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#F6FBF6' },
  pressed: { opacity: 0.85 },
  icon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  iconSelected: { backgroundColor: colors.primary },
  text: { flex: 1 },
  title: { fontSize: font.h3, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
