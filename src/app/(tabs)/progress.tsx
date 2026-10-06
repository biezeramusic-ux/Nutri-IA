import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_PADDING, TAB_BAR_SPACE, cardBase, colors, font, radius } from '../../constants/theme';
import { useDiary } from '../../hooks/useDiary';
import { useProfile } from '../../hooks/useProfile';
import { todayKey } from '../../services/date';
import { WEEKDAY_LABELS, mealsOfDay, sumMeals, weekDays } from '../../services/dayUtils';

const BAR_AREA_HEIGHT = 150;

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { meals } = useDiary();
  const { goals } = useProfile();

  const today = todayKey();
  const days = weekDays(new Date()).map((d, i) => {
    const key = todayKey(d);
    const kcal = sumMeals(mealsOfDay(meals, key)).kcal;
    return { key, label: WEEKDAY_LABELS[i], kcal, pct: Math.round((kcal / goals.calories) * 100), isToday: key === today };
  });

  const logged = days.filter((d) => d.kcal > 0);
  const average = logged.length ? Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length) : 0;
  const onTarget = logged.filter((d) => d.pct >= 80 && d.pct <= 110).length;
  const weekMeals = days.reduce((s, d) => s + mealsOfDay(meals, d.key).length, 0);
  const scale = Math.max(goals.calories * 1.2, ...days.map((d) => d.kcal));
  const barHeight = (kcal: number) => (kcal / scale) * (BAR_AREA_HEIGHT - 36);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: SCREEN_PADDING, paddingBottom: TAB_BAR_SPACE + 24, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Progresso</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Média diária (dias com registos)</Text>
        <View style={styles.bigRow}>
          <Text style={styles.big}>{average}</Text>
          <Text style={styles.unit}>kcal</Text>
          <Text style={styles.target}>Meta: {goals.calories} kcal</Text>
        </View>

        <View style={[styles.bars, { height: BAR_AREA_HEIGHT }]}>
          <View style={[styles.goalLine, { bottom: barHeight(goals.calories) + 22 }]} />
          {days.map((d) => (
            <View key={d.key} style={styles.barCol}>
              <Text style={styles.pct}>{d.kcal > 0 ? `${d.pct}%` : ''}</Text>
              <View style={styles.barTrack}>
                {d.kcal > 0 && (
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(6, barHeight(d.kcal)) },
                      d.isToday ? styles.barToday : styles.barNormal,
                      d.pct > 110 && styles.barOver,
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.day, d.isToday && styles.dayToday]}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.stat, { backgroundColor: colors.limeSoft, borderColor: '#E4F0BD' }]}>
          <Text style={styles.statValue}>{onTarget}</Text>
          <Text style={styles.statLabel}>dias dentro da meta</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.waterSoft, borderColor: '#BAE6FD' }]}>
          <Text style={styles.statValue}>{weekMeals}</Text>
          <Text style={styles.statLabel}>refeições nesta semana</Text>
        </View>
      </View>
      <Text style={styles.note}>Dentro da meta = entre 80% e 110% das calorias diárias.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: font.h1, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  card: { ...cardBase, padding: 16, gap: 12 },
  cardLabel: { fontSize: font.small, fontWeight: '500', color: colors.textMuted },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  big: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  unit: { fontSize: font.body, fontWeight: '500', color: colors.textMuted },
  target: { marginLeft: 'auto', fontSize: font.small, color: colors.textMuted },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 6 },
  goalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, opacity: 0.6 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 },
  pct: { fontSize: 10, fontWeight: '600', color: colors.textMuted, height: 13 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '64%', borderRadius: 6 },
  barNormal: { backgroundColor: colors.limeSoft, borderWidth: 1, borderColor: colors.lime },
  barToday: { backgroundColor: colors.primary },
  barOver: { backgroundColor: colors.danger, borderColor: colors.danger },
  day: { fontSize: font.tiny, color: colors.textMuted },
  dayToday: { color: colors.text, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: radius.card, borderWidth: 1, padding: 14, gap: 2 },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: font.small, color: colors.textMuted },
  note: { fontSize: font.tiny, color: colors.textFaint, textAlign: 'center' },
});
