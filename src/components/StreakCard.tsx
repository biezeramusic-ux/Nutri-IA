import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { ProgressRing } from './ProgressRing';
import { cardBase, font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { STREAK_MILESTONES, type StreakInfo } from '../services/streak';
import { MEDAL_TIERS, StreakMedal } from './StreakMedal';
import { tr } from '../i18n';

interface Props {
  streak: StreakInfo;
  /** Últimos 7 dias (do mais antigo para hoje): se houve registo. */
  last7: { label: string; done: boolean }[];
}

/** Sequência compacta: anel até à próxima conquista e os últimos 7 dias em pontos. */
export function StreakCard({ streak, last7 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { current, nextMilestone, today } = streak;
  const reachedIdx = STREAK_MILESTONES.reduce((acc, m, i) => (current >= m ? i : acc), -1);
  const tier = reachedIdx >= 0 ? MEDAL_TIERS[reachedIdx] : null;
  const title = current === 0 ? tr('Comece a sua sequência') : tr(current === 1 ? '{n} dia seguido' : '{n} dias seguidos', { n: current });
  const sub = tier && STREAK_MILESTONES[reachedIdx] === current ? tr('Conquistou a {medal}!', { medal: tr(tier.name).toLowerCase() }) : !today ? tr('Registe uma refeição hoje.') : nextMilestone ? tr('Próxima conquista: {n} dias', { n: nextMilestone }) : tr('Conquista máxima alcançada. Parabéns!');

  return (
    <View style={styles.card}>
      <ProgressRing size={tier ? 56 : 46} strokeWidth={5} progress={nextMilestone ? current / nextMilestone : 1} color={tier ? tier.dark : colors.text}>
        {tier ? <StreakMedal size={40} tier={tier} value={current} /> : <Text style={styles.count}>{current}</Text>}
      </ProgressRing>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <View style={styles.dots}>
        {last7.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 3 }}>
            <View style={[styles.dot, d.done && styles.dotOn]}>{d.done && <Check size={9} color={colors.background} strokeWidth={4} />}</View>
            <Text style={styles.dayLabel}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
    count: { fontSize: font.body, fontWeight: '800', color: colors.text },
    title: { fontSize: font.body, fontWeight: '700', color: colors.text },
    sub: { fontSize: font.tiny, color: colors.textMuted },
    dots: { flexDirection: 'row', gap: 4 },
    dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    dotOn: { backgroundColor: colors.text },
    dayLabel: { fontSize: 8, color: colors.textFaint },
  });
