import { BellRing, Droplets, GlassWater, Minus, Plus, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressRing } from '../components/ProgressRing';
import { ProGate } from '../components/ProOverlay';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, colors, font, radius } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useWater } from '../hooks/useWater';
import { GLASS_ML } from '../services/goals';
import { notificationsSupported } from '../services/notifications';
import { planWaterReminders } from '../services/waterReminderPlan';
import type { GoalType } from '../types';

const TIPS: Record<GoalType | 'generic', string> = {
  lose_weight: 'Beber água antes das refeições ajuda a controlar a fome e apoia a perda de peso.',
  maintain: 'Manter-se hidratado ajuda a manter o peso e a energia ao longo do dia.',
  gain_muscle: 'A água é essencial para a recuperação e o crescimento dos músculos.',
  eat_healthy: 'A água é a melhor bebida para uma alimentação equilibrada.',
  track_calories: 'A água não tem calorias e ajuda a sentir-se saciado.',
  generic: 'Beba água ao longo do dia, sobretudo nos dias de calor.',
};

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function WaterScreen() {
  const insets = useSafeAreaInsets();
  const water = useWater();
  const { profile } = useProfile();
  const goal = profile?.goal ?? null;

  const nextReminder = useMemo(() => {
    if (!profile?.waterReminders) return null;
    const plan = planWaterReminders({
      now: new Date(),
      glasses: water.glasses,
      goalGlasses: water.goalGlasses,
      wakeHour: profile.wakeHour,
      sleepHour: profile.sleepHour,
      goal,
      days: 2,
    });
    return plan[0] ?? null;
  }, [profile, water.glasses, water.goalGlasses, goal]);

  const done = water.glasses >= water.goalGlasses;

  const reminderText = !notificationsSupported
    ? 'Os lembretes funcionam na app instalada (APK). No Expo Go não estão disponíveis.'
    : !profile?.waterReminders
      ? 'Desligados. Pode ligá-los no Perfil.'
      : done
        ? 'Meta cumprida hoje. Voltamos a lembrá-lo amanhã.'
        : nextReminder
          ? `Próximo lembrete às ${formatTime(nextReminder.at)}${nextReminder.at.getDate() !== new Date().getDate() ? ' (amanhã)' : ''}.`
          : 'Sem lembretes pendentes por agora.';

  return (
    <ProGate feature="Registe a água que bebe e receba lembretes personalizados.">
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Água" />
      {!!water.error && <Text style={styles.error}>{water.error}</Text>}

      <View style={styles.card}>
        <ProgressRing size={160} strokeWidth={12} progress={water.glasses / water.goalGlasses} color={colors.water} trackColor={colors.waterSoft}>
          <Droplets size={22} color={colors.water} />
          <Text style={styles.ringValue}>{water.drankMl} ml</Text>
          <Text style={styles.ringSub}>de {water.goalMl} ml</Text>
        </ProgressRing>

        <Text style={styles.status}>{done ? 'Meta de hoje cumprida' : `Faltam ${water.goalGlasses - water.glasses} copos para a meta`}</Text>

        <View style={styles.glassRow}>
          {Array.from({ length: water.goalGlasses }).map((_, i) => (
            <GlassWater key={i} size={22} color={i < water.glasses ? colors.water : '#CBD5E1'} />
          ))}
        </View>

        <View style={styles.counter}>
          <Pressable style={styles.roundBtn} onPress={water.decrement} accessibilityLabel="Menos um copo">
            <Minus size={20} color={colors.text} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.big}>
              {water.glasses}
              <Text style={styles.bigSub}> / {water.goalGlasses}</Text>
            </Text>
            <Text style={styles.small}>copos de {GLASS_ML} ml</Text>
          </View>
          <Pressable style={[styles.roundBtn, styles.roundPrimary]} onPress={water.increment} accessibilityLabel="Mais um copo">
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Sparkles size={18} color={colors.limeDark} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.infoTitle}>Meta calculada pelo Nutri IA</Text>
          <Text style={styles.infoText}>
            {water.goalMl} ml por dia, com base no seu peso, atividade e no calor de Moçambique. {TIPS[goal ?? 'generic']}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <BellRing size={18} color={colors.water} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.infoTitle}>Lembretes de água</Text>
          <Text style={styles.infoText}>{reminderText}</Text>
        </View>
      </View>
    </ScrollView>
    </ProGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: font.h1, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  error: { fontSize: font.small, color: colors.danger },
  card: { ...cardBase, padding: 18, alignItems: 'center', gap: 14 },
  ringValue: { fontSize: font.h1, fontWeight: '700', color: colors.text, marginTop: 2 },
  ringSub: { fontSize: font.small, color: colors.textMuted },
  status: { fontSize: font.body, fontWeight: '600', color: colors.text },
  glassRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  roundPrimary: { backgroundColor: colors.water },
  big: { fontSize: 28, fontWeight: '700', color: colors.text },
  bigSub: { fontSize: font.h3, color: colors.textMuted, fontWeight: '500' },
  small: { fontSize: font.small, color: colors.textMuted },
  infoCard: { ...cardBase, flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg },
  infoTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  infoText: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
});
