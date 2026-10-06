import { Flame, Footprints, Timer, Trash } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressRing } from '../components/ProgressRing';
import { ProGate } from '../components/ProOverlay';
import { NumberStepper } from '../components/quiz/NumberStepper';
import { QuizChip } from '../components/quiz/QuizChip';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, colors, font, radius } from '../constants/theme';
import { useActivity } from '../hooks/useActivity';
import { useProfile } from '../hooks/useProfile';
import { ACTIVITY_TYPES, STEPS_GOAL, estimateKcal } from '../services/activity';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { activities, steps, setSteps, totals, error, add, remove } = useActivity();
  const [typeId, setTypeId] = useState(ACTIVITY_TYPES[0].id);
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const weight = profile?.quiz?.weightKg ?? 65;
  const type = ACTIVITY_TYPES.find((t) => t.id === typeId) ?? ACTIVITY_TYPES[0];
  const kcal = estimateKcal(type.met, weight, minutes);

  const submit = async () => {
    setSaving(true);
    try {
      await add({ type: type.label, minutes, kcal });
    } catch {
      Alert.alert('Não foi possível guardar', 'Verifique a ligação à internet e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProGate feature="Registe exercícios e passos e veja quantas calorias gastou.">
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 14 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title="Atividade física" />
          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={[styles.card, styles.stepsCard]}>
            <ProgressRing size={84} strokeWidth={8} progress={steps / STEPS_GOAL} color={colors.primary}>
              <Footprints size={22} color={colors.primary} />
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Passos de hoje</Text>
              <Text style={styles.big}>{steps.toLocaleString('pt-PT')}</Text>
              <Text style={styles.small}>Meta: {STEPS_GOAL.toLocaleString('pt-PT')} passos</Text>
            </View>
          </View>
          <NumberStepper label="Ajustar passos" value={steps} min={0} max={100000} step={500} onChange={setSteps} />

          <View style={styles.summaryRow}>
            <View style={[styles.summary, { backgroundColor: colors.limeSoft, borderColor: '#E4F0BD' }]}>
              <Flame size={16} color={colors.limeDark} />
              <Text style={styles.summaryValue}>{totals.kcal}</Text>
              <Text style={styles.small}>kcal gastas</Text>
            </View>
            <View style={[styles.summary, { backgroundColor: colors.waterSoft, borderColor: '#BAE6FD' }]}>
              <Timer size={16} color={colors.water} />
              <Text style={styles.summaryValue}>{totals.minutes}</Text>
              <Text style={styles.small}>minutos ativos</Text>
            </View>
          </View>

          <Text style={styles.section}>Registar atividade</Text>
          <View style={styles.card}>
            <View style={styles.chips}>
              {ACTIVITY_TYPES.map((t) => (
                <QuizChip key={t.id} label={t.label} selected={t.id === typeId} onPress={() => setTypeId(t.id)} />
              ))}
            </View>
            <NumberStepper label="Duração" value={minutes} unit="min" min={5} max={300} step={5} onChange={setMinutes} />
            <Text style={styles.small}>Gasto estimado: cerca de {kcal} kcal (com base no seu peso de {weight} kg).</Text>
            <Pressable style={[styles.cta, saving && { opacity: 0.6 }]} onPress={() => void submit()} disabled={saving}>
              <Text style={styles.ctaText}>Adicionar atividade</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>Hoje</Text>
          {activities.length === 0 ? (
            <Text style={styles.small}>Ainda não registou nenhuma atividade hoje.</Text>
          ) : (
            <View style={styles.card}>
              {activities.map((a, i) => (
                <View key={a.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{a.type}</Text>
                    <Text style={styles.small}>
                      {a.minutes} min · {a.kcal} kcal
                    </Text>
                  </View>
                  <Pressable
                    hitSlop={10}
                    accessibilityLabel="Apagar atividade"
                    onPress={() => remove(a.id).catch(() => Alert.alert('Não foi possível apagar', 'Verifique a ligação à internet.'))}
                  >
                    <Trash size={16} color={colors.textFaint} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </ProGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  error: { fontSize: font.small, color: colors.danger },
  card: { ...cardBase, padding: 14, gap: 12 },
  stepsCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardLabel: { fontSize: font.small, fontWeight: '500', color: colors.textMuted },
  big: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  small: { fontSize: font.small, color: colors.textMuted, lineHeight: 17 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summary: { flex: 1, borderRadius: radius.card, borderWidth: 1, padding: 14, gap: 2 },
  summaryValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  section: { fontSize: font.h2, fontWeight: '700', color: colors.text, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cta: { height: 46, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10 },
  rowTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
});
