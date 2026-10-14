import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import { ProgressRing } from '../components/ProgressRing';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { FASTING_PLANS, formatClock, formatHMS, useFasting } from '../hooks/useFasting';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';

const dayLabel = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function FastingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const f = useFasting();
  const startMs = f.active?.start ?? null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={tr('Jejum')} />

        <View style={[styles.card, { alignItems: 'center', gap: 16 }]}>
          <ProgressRing size={220} strokeWidth={16} progress={f.progress} color={f.done ? colors.primary : colors.text}>
            <Text style={styles.small}>{f.active ? (f.done ? tr('Objetivo atingido') : tr('Tempo restante')) : tr('Plano')}</Text>
            <Text style={styles.big}>{f.active ? formatHMS(f.done ? f.elapsedMs : f.remainingMs) : `${f.goalHours}:${24 - f.goalHours}`}</Text>
            {f.active && <Text style={styles.small}>{tr('Jejum')} {f.goalHours}h</Text>}
          </ProgressRing>

          <View style={styles.times}>
            <View style={styles.timeBox}>
              <Text style={styles.small}>{tr('Início')}</Text>
              <Text style={styles.timeValue}>{startMs ? formatClock(startMs) : '--:--'}</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.small}>{tr('Fim')}</Text>
              <Text style={styles.timeValue}>{f.endAt ? formatClock(f.endAt) : '--:--'}</Text>
            </View>
          </View>

          <Pressable style={[styles.cta, f.active && styles.ctaOutline]} onPress={f.active ? f.stop : () => f.start()}>
            <Text style={[styles.ctaText, f.active && { color: colors.text }]}>{f.active ? tr('Terminar jejum') : tr('Iniciar jejum')}</Text>
          </Pressable>
        </View>

        {!f.active && (
          <View style={styles.card}>
            <Text style={styles.section}>{tr('Escolha o seu plano')}</Text>
            <View style={styles.chips}>
              {FASTING_PLANS.map((h) => (
                <Pressable key={h} onPress={() => f.setGoal(h)} style={[styles.chip, f.goalHours === h && styles.chipOn]}>
                  <Text style={[styles.chipText, f.goalHours === h && { color: colors.background }]}>
                    {h}:{24 - h}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.small}>{tr('Jejua {h} horas e come nas restantes {e}.', { h: f.goalHours, e: 24 - f.goalHours })}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.section}>{tr('Histórico')}</Text>
          {f.history.length === 0 ? (
            <Text style={styles.small}>{tr('Ainda não há jejuns terminados.')}</Text>
          ) : (
            f.history.slice(0, 10).map((r) => {
              const hours = (r.end - r.start) / 3600000;
              const ok = hours >= r.goalHours;
              return (
                <View key={r.start} style={styles.histRow}>
                  <Text style={styles.histDate}>{dayLabel(r.start)}</Text>
                  <Text style={styles.histTime}>
                    {formatClock(r.start)} → {formatClock(r.end)}
                  </Text>
                  <Text style={[styles.histHours, { color: ok ? colors.primary : colors.textMuted }]}>
                    {hours.toFixed(1).replace('.', ',')}h / {r.goalHours}h
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    card: { ...cardBase(colors), padding: 18, gap: 12 },
    small: { fontSize: font.small, color: colors.textMuted },
    big: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
    times: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
    timeBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, alignItems: 'center', gap: 2 },
    timeValue: { fontSize: font.h2, fontWeight: '700', color: colors.text },
    cta: { alignSelf: 'stretch', height: 52, borderRadius: radius.pill, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
    ctaOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    ctaText: { fontSize: font.h3, fontWeight: '600', color: colors.background },
    section: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.surface },
    chipOn: { backgroundColor: colors.text },
    chipText: { fontSize: font.body, fontWeight: '600', color: colors.text },
    histRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    histDate: { width: 44, fontSize: font.small, color: colors.textMuted },
    histTime: { flex: 1, fontSize: font.body, color: colors.text },
    histHours: { fontSize: font.small, fontWeight: '600' },
  });
