import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../components/AppText';
import { cardBase, font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { STREAK_MILESTONES, type StreakInfo } from '../services/streak';
import { MEDAL_TIERS } from './StreakMedal';
import { tr } from '../i18n';

interface Props {
  streak: StreakInfo;
  /** Últimos 7 dias (do mais antigo para hoje): se houve registo. */
  last7: { label: string; done: boolean }[];
}

/** Sequência: chama com o número de dias lá dentro e, em baixo, os últimos 7 dias assinalados. */
export function StreakCard({ streak, last7 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { current, nextMilestone, today } = streak;
  const reachedIdx = STREAK_MILESTONES.reduce((acc, m, i) => (current >= m ? i : acc), -1);
  const tier = reachedIdx >= 0 ? MEDAL_TIERS[reachedIdx] : null;
  const title = current === 0 ? tr('Comece a sua sequência') : tr(current === 1 ? '{n} dia seguido' : '{n} dias seguidos', { n: current });
  const sub = tier && STREAK_MILESTONES[reachedIdx] === current ? tr('Conquistou a {medal}!', { medal: tr(tier.name).toLowerCase() }) : !today ? tr('Registe uma refeição hoje.') : nextMilestone ? tr('Próxima conquista: {n} dias', { n: nextMilestone }) : tr('Conquista máxima alcançada. Parabéns!');
  const on = current > 0;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flameBox}>
          <Svg width={58} height={72} viewBox="0 0 24 30" style={StyleSheet.absoluteFill}>
            <Path d="M12 1c1 5 6 8 6 15a6 6 0 0 1-12 0c0-2 .8-3.6 2-5 .3 1.6 1.2 2.4 2 2.6C9.600 9 10.400 4.600 12 1z" fill={on ? '#FB923C' : colors.surface} />
            <Path d="M12 14c.6 2.400 3 3.400 3 6.200a3 3 0 0 1-6 0c0-1.800 1.600-3 3-6.200z" fill={on ? '#FDE68A' : colors.border} />
          </Svg>
          <Text style={[styles.count, { color: on ? '#7C2D12' : colors.textMuted }]}>{current}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
      </View>
      <View style={styles.dots}>
        {last7.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <View style={[styles.dot, d.done && styles.dotOn]}>{d.done && <Check size={16} color="#fff" strokeWidth={3.5} />}</View>
            <Text style={styles.dayLabel}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), gap: 16, paddingVertical: 16, paddingHorizontal: 16 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    flameBox: { width: 58, height: 72, alignItems: 'center', justifyContent: 'flex-end' },
    count: { fontSize: 22, fontWeight: '900', marginBottom: 12 },
    title: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    sub: { fontSize: font.small, color: colors.textMuted },
    dots: { flexDirection: 'row', justifyContent: 'space-between' },
    dot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    dotOn: { backgroundColor: '#22A559' },
    dayLabel: { fontSize: font.tiny, fontWeight: '600', color: colors.textMuted },
  });
