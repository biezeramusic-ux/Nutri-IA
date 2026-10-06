import { BellRing } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '../constants/theme';

interface Props {
  text: string;
  onActivate: () => void;
  onDismiss: () => void;
  busy?: boolean;
}

/** Convite para ativar os lembretes de água, com texto adaptado ao objetivo da pessoa. */
export function WaterReminderCard({ text, onActivate, onDismiss, busy }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <BellRing size={18} color={colors.water} />
        </View>
        <Text style={styles.title}>Ative os lembretes de água</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.actions}>
        <Pressable onPress={onDismiss} style={styles.ghost}>
          <Text style={styles.ghostText}>Agora não</Text>
        </Pressable>
        <Pressable onPress={onActivate} disabled={busy} style={[styles.primary, busy && { opacity: 0.6 }]}>
          <Text style={styles.primaryText}>Ativar lembretes</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.waterSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.h3, fontWeight: '600', color: colors.text, flex: 1 },
  text: { fontSize: font.body, color: colors.textMuted, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  ghost: { flex: 1, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontSize: font.body, fontWeight: '500', color: colors.textMuted },
  primary: { flex: 1.4, height: 40, borderRadius: radius.md, backgroundColor: colors.water, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: font.body, fontWeight: '600', color: '#fff' },
});
