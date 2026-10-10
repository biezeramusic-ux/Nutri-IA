import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { STREAK_MILESTONES, type StreakInfo } from '../services/streak';
import { tr } from '../i18n';

interface Props {
  streak: StreakInfo;
}

export function StreakCard({ streak }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { current, best, today, nextMilestone } = streak;
  const title = current === 0 ? tr('Comece a sua sequência') : tr(current === 1 ? '{n} dia seguido' : '{n} dias seguidos', { n: current });
  const sub = !today
    ? current > 0
      ? 'Registe uma refeição hoje para manter a sequência.'
      : 'Registe uma refeição hoje para começar.'
    : nextMilestone
      ? tr(nextMilestone - current === 1 ? 'Falta 1 dia para a próxima conquista.' : 'Faltam {n} dias para a próxima conquista.', { n: nextMilestone - current })
      : 'Conquista máxima alcançada. Parabéns!';

  return (
    <View style={styles.card}>
      <View style={[styles.flame, current > 0 && styles.flameOn]}>
        <Text style={{ fontSize: 22, opacity: current > 0 ? 1 : 0.4 }}>🔥</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
        <View style={styles.badges}>
          {STREAK_MILESTONES.map((m) => (
            <View key={m} style={[styles.badge, best >= m && styles.badgeOn]}>
              <Text style={[styles.badgeText, best >= m && styles.badgeTextOn]}>{m}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    flame: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    flameOn: { backgroundColor: colors.limeSoft },
    title: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    sub: { fontSize: font.small, color: colors.textMuted },
    badges: { flexDirection: 'row', gap: 6, marginTop: 6 },
    badge: { minWidth: 26, height: 22, paddingHorizontal: 6, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    badgeOn: { backgroundColor: colors.primary },
    badgeText: { fontSize: 10, fontWeight: '700', color: colors.textFaint },
    badgeTextOn: { color: '#fff' },
  });
