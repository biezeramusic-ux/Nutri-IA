import { Lock } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { MEDAL_TIERS, StreakMedal } from './StreakMedal';
import { cardBase, font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { STREAK_MILESTONES } from '../services/streak';
import { tr } from '../i18n';

/** Todas as medalhas da sequência: as conquistadas a cores, as outras esbatidas com o número de dias que faltam. */
export function MedalsGallery({ best }: { best: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const earned = STREAK_MILESTONES.filter((m) => best >= m).length;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{tr('Medalhas')}</Text>
        <Text style={styles.count}>
          {earned}/{STREAK_MILESTONES.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {STREAK_MILESTONES.map((m, i) => {
          const on = best >= m;
          return (
            <View key={m} style={styles.item}>
              <View style={{ opacity: on ? 1 : 0.22 }}>
                <StreakMedal size={64} tier={MEDAL_TIERS[i]} value={m} />
              </View>
              {!on && (
                <View style={styles.lock}>
                  <Lock size={12} color={colors.textMuted} />
                </View>
              )}
              <Text style={[styles.label, on && { color: colors.text, fontWeight: '700' }]}>{m} {tr('dias')}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>{tr('Registe uma refeição todos os dias para conquistar as medalhas.')}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), padding: 16, gap: 12 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    count: { fontSize: font.small, fontWeight: '700', color: colors.textMuted },
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
    item: { width: '33.33%', alignItems: 'center', gap: 4 },
    lock: { position: 'absolute', top: 44, left: '50%', marginLeft: 14, backgroundColor: colors.card, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border },
    label: { fontSize: font.tiny, color: colors.textMuted },
    hint: { fontSize: font.small, color: colors.textMuted, textAlign: 'center' },
  });
