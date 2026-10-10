import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Activity, Camera, ChevronRight, Crown, Droplets, Gift, LogOut, Moon, Pencil, RefreshCw, Star, Sun, Target, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumberStepper } from '../../components/quiz/NumberStepper';
import { SCREEN_PADDING, TAB_BAR_SPACE, cardBase, font, radius, type ThemeColors } from '../../constants/theme';
import { useAvatar } from '../../hooks/useAvatar';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useSubscription } from '../../hooks/useSubscription';
import { GLASS_ML, glassesFromMl } from '../../services/goals';
import { ensureNotificationPermission, notificationsSupported, scheduleMealReminders } from '../../services/notifications';
import { GOAL_LABEL } from '../../constants/labels';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ThemeChoice } from '../../components/ThemeChoice';
import { tr } from '../../i18n';


const SAVE_DELAY_MS = 700;

export default function ProfileScreen() {
  const { colors, mode, setMode, isDark } = useTheme();
  const avatar = useAvatar();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, displayName, signOut } = useAuth();
  const { profile, goals, saveReminders, saveWaterGoalMl } = useProfile();
  const { isPremium, trialDaysLeft, lockReason } = useSubscription();

  const [reminders, setReminders] = useState(profile?.waterReminders ?? true);
  const [wake, setWake] = useState(profile?.wakeHour ?? 7);
  const [sleep, setSleep] = useState(profile?.sleepHour ?? 22);
  const [waterMl, setWaterMl] = useState(goals.waterMl);
  const [mealReminders, setMealReminders] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('nutria.mealReminders')
      .then((v) => setMealReminders(v === '1'))
      .catch(() => undefined);
  }, []);

  const toggleMealReminders = async (value: boolean) => {
    if (value && !notificationsSupported) {
      Alert.alert(tr('Disponível na app instalada'), tr('As notificações não funcionam no Expo Go. Instale a app (APK) para receber os lembretes.'));
    } else if (value && !(await scheduleMealReminders(true))) {
      Alert.alert(tr('Notificações desligadas'), tr('Ative as notificações do Nutri IA nas definições do telemóvel.'));
      return;
    } else if (!value) {
      await scheduleMealReminders(false);
    }
    setMealReminders(value);
    await AsyncStorage.setItem('nutria.mealReminders', value ? '1' : '0').catch(() => undefined);
  };

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
        Alert.alert(tr('Não foi possível guardar'), tr('Verifique a ligação à internet.')),
      );
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reminders, wake, sleep, profile, saveReminders]);

  useEffect(() => {
    if (!profile?.goals || waterMl === profile.goals.waterMl) return;
    const timer = setTimeout(() => {
      saveWaterGoalMl(waterMl).catch(() => Alert.alert(tr('Não foi possível guardar'), tr('Verifique a ligação à internet.')));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [waterMl, profile, saveWaterGoalMl]);

  const toggleReminders = async (value: boolean) => {
    if (value && !notificationsSupported) {
      Alert.alert(
        'Disponível na app instalada',
        tr('As notificações não funcionam no Expo Go. Instale a app (APK) para receber os lembretes. A sua escolha fica guardada.'),
      );
    } else if (value && !(await ensureNotificationPermission(true))) {
      Alert.alert(tr('Notificações desligadas'), tr('Ative as notificações do Nutri IA nas definições do telemóvel para receber lembretes.'));
    }
    setReminders(value);
  };

  const confirmSignOut = () =>
    Alert.alert(tr('Terminar sessão'), tr('Deseja sair da sua conta?'), [
      { text: tr('Cancelar'), style: 'cancel' },
      { text: tr('Sair'), style: 'destructive', onPress: () => void signOut() },
    ]);

  const planText = isPremium
    ? 'Premium ativo'
    : lockReason === 'trial_expired'
      ? 'Teste grátis terminado'
      : tr(trialDaysLeft === 1 ? 'Teste grátis: 1 dia restante' : 'Teste grátis: {n} dias restantes', { n: trialDaysLeft });

  const initials = (displayName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const Row = ({ icon: Icon, label, onPress, value }: { icon: LucideIcon; label: string; onPress: () => void; value?: string }) => (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Icon size={17} color={colors.limeDark} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {!!value && <Text style={styles.rowValue}>{value}</Text>}
      <ChevronRight size={18} color={colors.textFaint} />
    </Pressable>
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.decoA} />
        <View style={styles.decoB} />
        <Pressable style={styles.avatar} onPress={() => router.push('/edit-profile')} accessibilityLabel={tr('Editar perfil')}>
          {avatar.uri ? (
            <Image source={{ uri: avatar.uri }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </Pressable>
        <Text style={styles.name}>{displayName || 'Utilizador'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.chipRow}>
          <View style={[styles.planChip, isPremium && styles.planChipPro]}>
            {isPremium && <Crown size={12} color="#0B1F3A" />}
            <Text style={[styles.planChipText, isPremium && { color: '#0B1F3A' }]}>{isPremium ? 'Nutri IA Pro' : planText}</Text>
          </View>
        </View>
        <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
          <Pencil size={14} color="#fff" />
          <Text style={styles.editText}>{tr('Editar perfil')}</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr('O meu plano diário')}</Text>
          <Text style={styles.goal}>{profile?.goal ? GOAL_LABEL[profile.goal] : 'Quiz por fazer'}</Text>
          <View style={styles.planRow}>
            <View style={styles.planItem}>
              <Text style={styles.planValue}>{goals.calories}</Text>
              <Text style={styles.planLabel}>{tr('kcal')}</Text>
            </View>
            <View style={styles.planItem}>
              <Text style={[styles.planValue, { color: colors.protein }]}>{goals.proteinG}g</Text>
              <Text style={styles.planLabel}>{tr('proteína')}</Text>
            </View>
            <View style={styles.planItem}>
              <Text style={[styles.planValue, { color: colors.carbs }]}>{goals.carbsG}g</Text>
              <Text style={styles.planLabel}>{tr('carbs')}</Text>
            </View>
            <View style={styles.planItem}>
              <Text style={[styles.planValue, { color: colors.fats }]}>{goals.fatsG}g</Text>
              <Text style={styles.planLabel}>{tr('gordura')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>{tr('Atalhos')}</Text>
        <View style={styles.group}>
          <Row icon={Target} label={tr('Objetivos')} onPress={() => router.push('/goals')} />
          <Row icon={Activity} label={tr('Atividade física')} onPress={() => router.push('/activity')} />
          <Row icon={Droplets} label={tr('Registo de água')} onPress={() => router.push('/water')} />
          <Row icon={Star} label={tr('Refeições favoritas')} onPress={() => router.push('/favorites')} />
          <Row icon={UtensilsCrossed} label={tr('Pratos moçambicanos')} onPress={() => router.push('/dishes')} />
          <Row icon={Camera} label={tr('Fotos de progresso')} onPress={() => router.push('/progress-photos')} />
          <Row icon={Gift} label={tr('Convidar amigos (5% de desconto)')} onPress={() => router.push('/invite')} />
          <Row icon={RefreshCw} label={tr('Refazer o quiz')} onPress={() => router.push('/quiz')} />
        </View>

        <Text style={styles.section}>{tr('Aparência')}</Text>
        <View style={styles.card}>
          <View style={styles.themeHead}>
            {isDark ? <Moon size={18} color={colors.primaryDark} /> : <Sun size={18} color={colors.primaryDark} />}
            <Text style={styles.cardTitle}>{tr('Cor da app')}</Text>
          </View>
          <ThemeChoice />
        </View>

        <Text style={styles.section}>{tr('Idioma')}</Text>
        <View style={styles.card}>
          <LanguageSelector />
        </View>

        <Text style={styles.section}>{tr('Lembretes')}</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{tr('Lembretes de água')}</Text>
              <Text style={styles.sub}>{tr('O Nutri IA avisa-o para beber água ao longo do dia.')}</Text>
            </View>
            <Switch
              value={reminders}
              onValueChange={(v) => void toggleReminders(v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
          {reminders && (
            <View style={{ gap: 10 }}>
              <NumberStepper label={tr('Acordo às (hora)')} value={wake} unit="h" min={4} max={12} onChange={setWake} />
              <NumberStepper label={tr('Vou dormir às (hora)')} value={sleep} unit="h" min={18} max={24} onChange={setSleep} />
            </View>
          )}
          <NumberStepper
            label={tr('Meta de água ({n} copos de {ml} ml)', { n: glassesFromMl(waterMl), ml: GLASS_ML })}
            value={waterMl}
            unit="ml"
            min={1000}
            max={6000}
            step={250}
            onChange={setWaterMl}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{tr('Lembretes de refeição')}</Text>
              <Text style={styles.sub}>{tr('Avisos às 8h15, 12h45 e 19h30 para registar o que comeu.')}</Text>
            </View>
            <Switch
              value={mealReminders}
              onValueChange={(v) => void toggleMealReminders(v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.section}>{tr('Subscrição')}</Text>
        <View style={styles.card}>
          <Text style={styles.sub}>{planText}</Text>
          {!isPremium && (
            <Pressable style={styles.cta} onPress={() => router.push('/paywall')}>
              <Crown size={16} color="#fff" />
              <Text style={styles.ctaText}>{tr('Ver planos Pro')}</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={styles.signOut} onPress={confirmSignOut}>
          <LogOut size={18} color={colors.danger} />
          <Text style={styles.signOutText}>{tr('Terminar sessão')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    hero: { backgroundColor: colors.hero, paddingHorizontal: SCREEN_PADDING, paddingBottom: 26, alignItems: 'center', gap: 4, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
    decoA: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.primary, opacity: 0.3, top: -80, right: -70 },
    decoB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: colors.lime, opacity: 0.18, bottom: -50, left: -40 },
    avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
    avatarImg: { width: 70, height: 70, borderRadius: 35 },
    avatarText: { fontSize: 28, fontWeight: '700', color: '#0B1F3A' },
    name: { fontSize: font.h1, fontWeight: '700', color: '#fff', marginTop: 8 },
    email: { fontSize: font.small, color: 'rgba(255,255,255,0.75)' },
    chipRow: { flexDirection: 'row', marginTop: 8 },
    planChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
    planChipPro: { backgroundColor: colors.lime },
    planChipText: { fontSize: font.small, fontWeight: '600', color: '#fff' },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: radius.pill, paddingHorizontal: 16, height: 36 },
    editText: { color: '#fff', fontWeight: '600', fontSize: font.body },
    body: { paddingHorizontal: SCREEN_PADDING, paddingTop: 18, gap: 10 },
    section: { fontSize: font.small, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
    card: { ...cardBase(colors), padding: 16, gap: 12 },
    cardTitle: { fontSize: font.h3, fontWeight: '600', color: colors.text },
    goal: { fontSize: font.body, color: colors.textMuted },
    planRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 },
    planItem: { flex: 1, alignItems: 'center' },
    planValue: { fontSize: font.h2, fontWeight: '700', color: colors.text },
    planLabel: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
    group: { ...cardBase(colors), paddingHorizontal: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 12 },
    rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: font.body, fontWeight: '500', color: colors.text },
    rowValue: { fontSize: font.small, color: colors.textMuted },
    subLabel: { fontSize: font.small, fontWeight: '600', color: colors.textMuted, marginTop: 4 },
    themeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sub: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
    cta: { flexDirection: 'row', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, height: 46, alignItems: 'center', justifyContent: 'center' },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: font.body },
    signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: radius.md, backgroundColor: colors.dangerSoft, marginTop: 8 },
    signOutText: { color: colors.danger, fontWeight: '600', fontSize: font.body },
  });
