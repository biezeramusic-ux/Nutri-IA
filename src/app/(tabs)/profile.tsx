import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumberStepper } from '../../components/quiz/NumberStepper';
import { TAB_BAR_SPACE, colors, radius, shadow } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useSubscription } from '../../hooks/useSubscription';
import { GLASS_ML, glassesFromMl } from '../../services/goals';
import { ensureNotificationPermission } from '../../services/notifications';
import type { GoalType } from '../../types';

const GOAL_LABEL: Record<GoalType, string> = {
  lose_weight: 'Perder peso',
  maintain: 'Manter o peso',
  gain_muscle: 'Ganhar massa muscular',
  eat_healthy: 'Comer mais saudável',
  track_calories: 'Saber as calorias dos meus pratos',
};

const SAVE_DELAY_MS = 700;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, displayName, signOut } = useAuth();
  const { profile, goals, saveReminders, saveWaterGoalMl } = useProfile();
  const { isPremium, trialDaysLeft, lockReason } = useSubscription();

  const [reminders, setReminders] = useState(profile?.waterReminders ?? true);
  const [wake, setWake] = useState(profile?.wakeHour ?? 7);
  const [sleep, setSleep] = useState(profile?.sleepHour ?? 22);
  const [waterMl, setWaterMl] = useState(goals.waterMl);

  // Sincroniza quando o perfil chega do servidor.
  useEffect(() => {
    if (!profile) return;
    setReminders(profile.waterReminders);
    setWake(profile.wakeHour);
    setSleep(profile.sleepHour);
    setWaterMl(profile.goals?.waterMl ?? goals.waterMl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.waterReminders, profile?.wakeHour, profile?.sleepHour, profile?.goals?.waterMl]);

  // Guarda os lembretes (com pequeno atraso para agrupar toques).
  useEffect(() => {
    if (!profile) return;
    if (reminders === profile.waterReminders && wake === profile.wakeHour && sleep === profile.sleepHour) return;
    const timer = setTimeout(() => {
      saveReminders({ waterReminders: reminders, wakeHour: wake, sleepHour: sleep }).catch(() =>
        Alert.alert('Não foi possível guardar', 'Verifique a ligação à internet.'),
      );
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reminders, wake, sleep, profile, saveReminders]);

  useEffect(() => {
    if (!profile?.goals || waterMl === profile.goals.waterMl) return;
    const timer = setTimeout(() => {
      saveWaterGoalMl(waterMl).catch(() => Alert.alert('Não foi possível guardar', 'Verifique a ligação à internet.'));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [waterMl, profile, saveWaterGoalMl]);

  const toggleReminders = async (value: boolean) => {
    if (value && !(await ensureNotificationPermission(true))) {
      Alert.alert('Notificações desligadas', 'Ative as notificações do Nutri AI nas definições do telemóvel para receber lembretes.');
    }
    setReminders(value);
  };

  const confirmSignOut = () =>
    Alert.alert('Terminar sessão', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);

  const planText = isPremium
    ? 'Premium ativo'
    : lockReason === 'trial_expired'
      ? 'Teste grátis terminado'
      : `Teste grátis: ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'} restantes`;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE + 40, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(displayName || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName || 'Utilizador'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>O meu plano</Text>
        <Text style={styles.goal}>{profile?.goal ? GOAL_LABEL[profile.goal] : 'Quiz por fazer'}</Text>
        <View style={styles.planRow}>
          <View style={styles.planItem}>
            <Text style={styles.planValue}>{goals.calories}</Text>
            <Text style={styles.planLabel}>kcal</Text>
          </View>
          <View style={styles.planItem}>
            <Text style={styles.planValue}>{goals.proteinG}g</Text>
            <Text style={styles.planLabel}>proteína</Text>
          </View>
          <View style={styles.planItem}>
            <Text style={styles.planValue}>{goals.carbsG}g</Text>
            <Text style={styles.planLabel}>carbs</Text>
          </View>
          <View style={styles.planItem}>
            <Text style={styles.planValue}>{goals.fatsG}g</Text>
            <Text style={styles.planLabel}>gordura</Text>
          </View>
        </View>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/quiz')}>
          <Ionicons name="refresh" size={16} color={colors.primaryDark} />
          <Text style={styles.linkText}>Refazer o quiz e recalcular</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Lembretes de água</Text>
            <Text style={styles.sub}>O Nutri avisa-o para beber água ao longo do dia.</Text>
          </View>
          <Switch
            value={reminders}
            onValueChange={(v) => void toggleReminders(v)}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
        {reminders && (
          <View style={{ gap: 12 }}>
            <NumberStepper label="Acordo às (hora)" value={wake} unit="h" min={4} max={12} onChange={setWake} />
            <NumberStepper label="Vou dormir às (hora)" value={sleep} unit="h" min={18} max={24} onChange={setSleep} />
          </View>
        )}
        <NumberStepper
          label={`Meta de água (${glassesFromMl(waterMl)} copos de ${GLASS_ML} ml)`}
          value={waterMl}
          unit="ml"
          min={1000}
          max={6000}
          step={250}
          onChange={setWaterMl}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subscrição</Text>
        <Text style={styles.sub}>{planText}</Text>
        {!isPremium && (
          <Pressable style={styles.cta} onPress={() => router.push('/paywall')}>
            <Text style={styles.ctaText}>Ver planos</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.signOut} onPress={confirmSignOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>Terminar sessão</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800', color: colors.text },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  email: { fontSize: 13, color: colors.textMuted },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, gap: 12, ...shadow },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  goal: { fontSize: 14, fontWeight: '700', color: colors.limeDark },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: radius.md, padding: 14 },
  planItem: { alignItems: 'center', flex: 1 },
  planValue: { fontSize: 17, fontWeight: '800', color: colors.text },
  planLabel: { fontSize: 11, color: colors.textMuted },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  linkText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cta: { height: 48, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
  signOut: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: radius.pill, backgroundColor: '#FDECEA' },
  signOutText: { color: colors.danger, fontWeight: '800', fontSize: 15 },
});
