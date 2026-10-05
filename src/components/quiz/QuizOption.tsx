import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../../constants/theme';
import type { IconName } from '../../types';

interface Props {
  icon: IconName;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}

/** Cartão grande de resposta do quiz. */
export function QuizOption({ icon, title, subtitle, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]} accessibilityRole="button">
      <View style={[styles.icon, selected && styles.iconSelected]}>
        <MaterialCommunityIcons name={icon} size={24} color={selected ? '#fff' : colors.limeDark} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#F6FBEF' },
  icon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  iconSelected: { backgroundColor: colors.primary },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
