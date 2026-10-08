import { useRouter } from 'expo-router';
import { Camera, Dumbbell, HeartPulse, Leaf, Scale } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProGate } from '../components/ProOverlay';
import { NumberStepper } from '../components/quiz/NumberStepper';
import { QuizOption } from '../components/quiz/QuizOption';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useProfile } from '../hooks/useProfile';
import { calculateGoals } from '../services/goals';
import type { GoalType } from '../types';

const GOALS: { value: GoalType; icon: typeof Scale; title: string; subtitle: string }[] = [
  { value: 'lose_weight', icon: Scale, title: 'Perder peso', subtitle: 'Défice calórico saudável' },
  { value: 'track_calories', icon: Camera, title: 'Saber as calorias dos meus pratos', subtitle: 'Scanner e diário alimentar' },
  { value: 'maintain', icon: HeartPulse, title: 'Manter o meu peso', subtitle: 'Equilíbrio no dia a dia' },
  { value: 'gain_muscle', icon: Dumbbell, title: 'Ganhar massa muscular', subtitle: 'Mais proteína e energia' },
  { value: 'eat_healthy', icon: Leaf, title: 'Comer mais saudável', subtitle: 'Melhores escolhas' },
];

export default function GoalsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, goals, completeOnboarding, saveGoals } = useProfile();
  const quiz = profile?.quiz ?? null;

  const [calories, setCalories] = useState(goals.calories);
  const [protein, setProtein] = useState(goals.proteinG);
  const [carbs, setCarbs] = useState(goals.carbsG);
  const [fats, setFats] = useState(goals.fatsG);
  const [water, setWater] = useState(goals.waterMl);
  const [target, setTarget] = useState(quiz?.targetWeightKg ?? 65);
  const [saving, setSaving] = useState(false);

  // Sincroniza os campos quando as metas mudam (ex.: depois de mudar o objetivo).
  useEffect(() => {
    setCalories(goals.calories);
    setProtein(goals.proteinG);
    setCarbs(goals.carbsG);
    setFats(goals.fatsG);
    setWater(goals.waterMl);
    setTarget(quiz?.targetWeightKg ?? 65);
  }, [goals.calories, goals.proteinG, goals.carbsG, goals.fatsG, goals.waterMl, quiz?.targetWeightKg]);

  const chooseGoal = (value: GoalType) => {
    if (!quiz) {
      Alert.alert('Faça o quiz primeiro', 'Precisamos dos seus dados para calcular as metas.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Fazer o quiz', onPress: () => router.push('/quiz') },
      ]);
      return;
    }
    if (value === quiz.goal) return;
    Alert.alert('Mudar de objetivo', 'As suas metas diárias vão ser recalculadas. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Continuar',
        onPress: () =>
          completeOnboarding({ ...quiz, goal: value }).catch(() =>
            Alert.alert('Não foi possível guardar', 'Verifique a ligação à internet.'),
          ),
      },
    ]);
  };

  const saveCustom = async () => {
    setSaving(true);
    try {
      await saveGoals({ calories, proteinG: protein, carbsG: carbs, fatsG: fats, waterMl: water }, target);
      Alert.alert('Metas guardadas', 'As suas metas personalizadas já estão ativas.');
    } catch {
      Alert.alert('Não foi possível guardar', 'Verifique a ligação à internet e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const resetAuto = async () => {
    if (!quiz) return;
    const auto = calculateGoals(quiz);
    setSaving(true);
    try {
      await saveGoals(auto, quiz.targetWeightKg);
    } catch {
      Alert.alert('Não foi possível guardar', 'Verifique a ligação à internet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Objetivos" />

        <Text style={styles.section}>O seu objetivo</Text>
        {GOALS.map((g) => (
          <QuizOption key={g.value} icon={g.icon} title={g.title} subtitle={g.subtitle} selected={quiz?.goal === g.value} onPress={() => chooseGoal(g.value)} />
        ))}

        <Text style={styles.section}>Metas diárias</Text>
        <View style={styles.card}>
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
          <Text style={styles.small}>Calculadas automaticamente a partir do seu quiz e do seu objetivo.</Text>
        </View>

        <Text style={styles.section}>Personalizar metas</Text>
        <ProGate inline feature="Ajuste as calorias, os macros, a água e o peso desejado.">
          <View style={[styles.card, { gap: 10 }]}>
            <NumberStepper label="Calorias" value={calories} unit="kcal" min={1000} max={5000} step={50} onChange={setCalories} />
            <NumberStepper label="Proteína" value={protein} unit="g" min={20} max={300} step={5} onChange={setProtein} />
            <NumberStepper label="Carboidratos" value={carbs} unit="g" min={50} max={600} step={5} onChange={setCarbs} />
            <NumberStepper label="Gorduras" value={fats} unit="g" min={20} max={200} step={5} onChange={setFats} />
            <NumberStepper label="Água" value={water} unit="ml" min={1000} max={6000} step={250} onChange={setWater} />
            <NumberStepper label="Peso desejado" value={target} unit="kg" min={30} max={300} step={0.5} onChange={setTarget} />
            <Pressable style={[styles.cta, saving && { opacity: 0.6 }]} onPress={() => void saveCustom()} disabled={saving}>
              <Text style={styles.ctaText}>Guardar metas</Text>
            </Pressable>
            {!!quiz && (
              <Pressable onPress={() => void resetAuto()} disabled={saving} style={styles.link}>
                <Text style={styles.linkText}>Repor metas automáticas</Text>
              </Pressable>
            )}
          </View>
        </ProGate>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  section: { fontSize: font.h2, fontWeight: '700', color: colors.text, marginTop: 6 },
  card: { ...cardBase(colors), padding: 14, gap: 10 },
  planRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 },
  planItem: { alignItems: 'center', flex: 1 },
  planValue: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  planLabel: { fontSize: font.tiny, color: colors.textMuted },
  small: { fontSize: font.small, color: colors.textMuted, lineHeight: 17 },
  cta: { height: 46, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  link: { alignItems: 'center', paddingVertical: 4 },
  linkText: { fontSize: font.small, fontWeight: '600', color: colors.primaryDark },
});
