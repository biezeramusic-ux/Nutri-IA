import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressRing } from '../../components/ProgressRing';
import { TAB_BAR_SPACE, colors, radius, shadow } from '../../constants/theme';
import { useProfile } from '../../hooks/useProfile';
import { useWater } from '../../hooks/useWater';
import { GLASS_ML } from '../../services/goals';
import { planWaterReminders } from '../../services/waterReminderPlan';
import type { GoalType } from '../../types';

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

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE + 40, gap: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Água</Text>
      {!!water.error && <Text style={styles.error}>{water.error}</Text>}

      <View style={styles.card}>
        <ProgressRing size={190} strokeWidth={16} progress={water.glasses / water.goalGlasses} color={colors.water} trackColor={colors.waterSoft}>
          <Ionicons name="water" size={28} color={colors.water} />
          <Text style={styles.ringValue}>{water.drankMl} ml</Text>
          <Text style={styles.ringSub}>de {water.goalMl} ml</Text>
        </ProgressRing>

        <Text style={styles.status}>
          {done ? '🎉 Meta de hoje cumprida!' : `Faltam ${water.goalGlasses - water.glasses} copos para a meta`}
        </Text>

        <View style={styles.glassRow}>
          {Array.from({ length: water.goalGlasses }).map((_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={i < water.glasses ? 'cup-water' : 'cup-outline'}
              size={28}
              color={i < water.glasses ? colors.water : '#CFD8DC'}
            />
          ))}
        </View>

        <View style={styles.counter}>
          <Pressable style={styles.roundBtn} onPress={water.decrement} accessibilityLabel="Menos um copo">
            <Ionicons name="remove" size={26} color={colors.text} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.big}>
              {water.glasses}
              <Text style={styles.bigSub}> / {water.goalGlasses}</Text>
            </Text>
            <Text style={styles.small}>copos de {GLASS_ML} ml</Text>
          </View>
          <Pressable style={[styles.roundBtn, styles.roundPrimary]} onPress={water.increment} accessibilityLabel="Mais um copo">
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="sparkles" size={22} color={colors.limeDark} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.infoTitle}>Meta calculada pelo Nutri</Text>
          <Text style={styles.infoText}>
            {water.goalMl} ml por dia, com base no seu peso, atividade e no calor de Moçambique. {TIPS[goal ?? 'generic']}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="notifications" size={22} color={colors.water} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.infoTitle}>Lembretes de água</Text>
          <Text style={styles.infoText}>
            {!profile?.waterReminders
              ? 'Desligados. Pode ligá-los no Perfil.'
              : done
                ? 'Meta cumprida hoje. Voltamos a lembrá-lo amanhã.'
                : nextReminder
                  ? `Próximo lembrete às ${formatTime(nextReminder.at)}${nextReminder.at.getDate() !== new Date().getDate() ? ' (amanhã)' : ''}.`
                  : 'Sem lembretes pendentes por agora.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  error: { fontSize: 12, color: colors.danger },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 22, alignItems: 'center', gap: 16, ...shadow },
  ringValue: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2 },
  ringSub: { fontSize: 12, color: colors.textMuted },
  status: { fontSize: 15, fontWeight: '700', color: colors.text },
  glassRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  roundBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  roundPrimary: { backgroundColor: colors.water },
  big: { fontSize: 38, fontWeight: '800', color: colors.text },
  bigSub: { fontSize: 18, color: colors.textMuted },
  small: { fontSize: 12, color: colors.textMuted },
  infoCard: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 16, ...shadow },
  infoTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  infoText: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
});
