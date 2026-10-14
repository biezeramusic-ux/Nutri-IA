import { Timer } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { formatHMS, useFasting } from '../hooks/useFasting';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';

/** Cartão do jejum na Home (para quem quer perder peso). */
export function FastingCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const f = useFasting();
  const open = () => router.push('/fasting');

  return (
    <Pressable style={styles.card} onPress={open}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Timer size={18} color={colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {tr('Jejum')} {f.goalHours}:{24 - f.goalHours}
          </Text>
          <Text style={styles.sub}>
            {f.active ? (f.done ? tr('Objetivo atingido') : tr('Faltam {time}', { time: formatHMS(f.remainingMs) })) : tr('Jejum intermitente')}
          </Text>
        </View>
        <Pressable style={[styles.btn, f.active && styles.btnOutline]} onPress={f.active ? open : () => (f.start(), open())} hitSlop={6}>
          <Text style={[styles.btnText, f.active && { color: colors.text }]}>{f.active ? tr('Ver') : tr('Iniciar jejum')}</Text>
        </Pressable>
      </View>
      {f.active && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${f.progress * 100}%` }]} />
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), padding: 14, gap: 12 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: font.body, fontWeight: '700', color: colors.text },
    sub: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
    btn: { backgroundColor: colors.text, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
    btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    btnText: { fontSize: font.small, fontWeight: '600', color: colors.background },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  });
