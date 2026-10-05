import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../../constants/theme';
import { useProfile } from '../../hooks/useProfile';
import { GLASS_ML, calculateGoals, glassesFromMl } from '../../services/goals';
import { ensureNotificationPermission } from '../../services/notifications';
import type { ActivityLevel, DietPreference, GoalType, IconName, QuizAnswers, Sex } from '../../types';
import { Logo } from '../Logo';
import { MacroSquareCard } from '../MacroSquareCard';
import { NumberStepper } from './NumberStepper';
import { QuizOption } from './QuizOption';

const TOTAL_QUESTIONS = 5;
const RESULT_STEP = TOTAL_QUESTIONS;

const GOALS: { value: GoalType; icon: IconName; title: string; subtitle: string }[] = [
  { value: 'lose_weight', icon: 'scale-bathroom', title: 'Perder peso', subtitle: 'Défice calórico saudável' },
  { value: 'track_calories', icon: 'camera-iris', title: 'Saber as calorias dos meus pratos', subtitle: 'Scanner e diário alimentar' },
  { value: 'maintain', icon: 'heart-pulse', title: 'Manter o meu peso', subtitle: 'Equilíbrio no dia a dia' },
  { value: 'gain_muscle', icon: 'arm-flex', title: 'Ganhar massa muscular', subtitle: 'Mais proteína e energia' },
  { value: 'eat_healthy', icon: 'leaf', title: 'Comer mais saudável', subtitle: 'Melhores escolhas' },
];

const ACTIVITIES: { value: ActivityLevel; icon: IconName; title: string; subtitle: string }[] = [
  { value: 'sedentary', icon: 'sofa', title: 'Pouco ativo', subtitle: 'Trabalho sentado, quase sem exercício' },
  { value: 'light', icon: 'walk', title: 'Ligeiramente ativo', subtitle: 'Exercício 1 a 3 vezes por semana' },
  { value: 'moderate', icon: 'run', title: 'Moderadamente ativo', subtitle: 'Exercício 3 a 5 vezes por semana' },
  { value: 'very_active', icon: 'dumbbell', title: 'Muito ativo', subtitle: 'Treino intenso ou trabalho físico' },
];

const DIETS: { value: DietPreference; label: string }[] = [
  { value: 'vegetarian', label: '🥦 Vegetariano' },
  { value: 'vegan', label: '🌱 Vegano' },
  { value: 'gluten_free', label: '🌾 Sem glúten' },
  { value: 'lactose_free', label: '🥛 Sem lactose' },
  { value: 'halal', label: '☪️ Halal' },
  { value: 'no_pork', label: '🐖 Sem carne de porco' },
];

const TITLES = [
  'O que o trouxe ao Nutri AI?',
  'Fale-nos de si',
  'A sua altura e peso',
  'Quão ativo é no dia a dia?',
  'Tem alguma preferência alimentar?',
];

const GOAL_TEXT: Record<GoalType, string> = {
  lose_weight: 'Criámos um défice calórico saudável para perder peso com segurança.',
  track_calories: 'Estas metas servem de referência para ver como estão os seus pratos.',
  maintain: 'Estas metas ajudam a manter o seu peso atual.',
  gain_muscle: 'Aumentámos calorias e proteína para apoiar o ganho de massa.',
  eat_healthy: 'Estas metas ajudam a fazer escolhas mais equilibradas.',
};

const DEFAULTS: QuizAnswers = {
  goal: 'track_calories',
  sex: 'female',
  age: 25,
  heightCm: 165,
  weightKg: 65,
  targetWeightKg: 60,
  activity: 'light',
  diet: [],
};

export function QuizFlow({ mode }: { mode: 'first' | 'redo' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, completeOnboarding } = useProfile();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(profile?.quiz ?? DEFAULTS);
  const [goalPicked, setGoalPicked] = useState(!!profile?.quiz);
  const [saving, setSaving] = useState(false);
  const touched = useRef(false);

  // Se o perfil só chegar depois de abrir o quiz (refazer), pré-carrega as respostas guardadas.
  useEffect(() => {
    if (profile?.quiz && !touched.current) {
      setAnswers(profile.quiz);
      setGoalPicked(true);
    }
  }, [profile?.quiz]);

  const set = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    touched.current = true;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else if (mode === 'redo') router.back();
  };

  const toggleDiet = (value: DietPreference) =>
    set('diet', answers.diet.includes(value) ? answers.diet.filter((d) => d !== value) : [...answers.diet, value]);

  const canContinue = step !== 0 || goalPicked;

  const finish = async () => {
    setSaving(true);
    try {
      await completeOnboarding(answers);
      // Pede a permissão para os lembretes de água só no primeiro quiz.
      if (mode === 'first') await ensureNotificationPermission(true);
      router.replace('/');
    } catch {
      Alert.alert('Não foi possível guardar', 'Verifique a ligação à internet e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const goals = step === RESULT_STEP ? calculateGoals(answers) : null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 22, paddingBottom: 140, gap: 14 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Pressable onPress={goBack} style={[styles.back, step === 0 && mode === 'first' && styles.hidden]} disabled={step === 0 && mode === 'first'}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.progress}>
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <View key={i} style={[styles.segment, i <= Math.min(step, TOTAL_QUESTIONS - 1) && styles.segmentOn]} />
            ))}
          </View>
          <Text style={styles.count}>{Math.min(step + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</Text>
        </View>

        {step < TOTAL_QUESTIONS ? (
          <Text style={styles.title}>{TITLES[step]}</Text>
        ) : (
          <View style={styles.resultHead}>
            <Logo size={64} />
            <Text style={styles.title}>O seu plano está pronto!</Text>
          </View>
        )}

        {step === 0 &&
          GOALS.map((g) => (
            <QuizOption
              key={g.value}
              icon={g.icon}
              title={g.title}
              subtitle={g.subtitle}
              selected={goalPicked && answers.goal === g.value}
              onPress={() => {
                set('goal', g.value);
                setGoalPicked(true);
              }}
            />
          ))}

        {step === 1 && (
          <>
            <QuizOption icon="face-woman" title="Mulher" selected={answers.sex === 'female'} onPress={() => set('sex', 'female' as Sex)} />
            <QuizOption icon="face-man" title="Homem" selected={answers.sex === 'male'} onPress={() => set('sex', 'male' as Sex)} />
            <NumberStepper label="Idade" value={answers.age} unit="anos" min={10} max={100} onChange={(v) => set('age', v)} />
          </>
        )}

        {step === 2 && (
          <>
            <NumberStepper label="Altura" value={answers.heightCm} unit="cm" min={100} max={250} onChange={(v) => set('heightCm', v)} />
            <NumberStepper label="Peso atual" value={answers.weightKg} unit="kg" min={30} max={300} onChange={(v) => set('weightKg', v)} />
            <NumberStepper label="Peso desejado" value={answers.targetWeightKg} unit="kg" min={30} max={300} onChange={(v) => set('targetWeightKg', v)} />
          </>
        )}

        {step === 3 &&
          ACTIVITIES.map((a) => (
            <QuizOption
              key={a.value}
              icon={a.icon}
              title={a.title}
              subtitle={a.subtitle}
              selected={answers.activity === a.value}
              onPress={() => set('activity', a.value)}
            />
          ))}

        {step === 4 && (
          <>
            <Text style={styles.hint}>Pode escolher várias, ou nenhuma.</Text>
            <View style={styles.chips}>
              {DIETS.map((d) => {
                const on = answers.diet.includes(d.value);
                return (
                  <Pressable key={d.value} onPress={() => toggleDiet(d.value)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{d.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {goals && (
          <>
            <View style={styles.kcalCard}>
              <Text style={styles.kcalLabel}>Meta diária</Text>
              <Text style={styles.kcalValue}>{goals.calories}</Text>
              <Text style={styles.kcalLabel}>calorias por dia</Text>
            </View>
            <View style={styles.macroRow}>
              <MacroSquareCard label="Proteína" percent={0} grams={goals.proteinG} color={colors.primary} unitOnly />
              <MacroSquareCard label="Carbs" percent={0} grams={goals.carbsG} color={colors.carbs} unitOnly />
              <MacroSquareCard label="Gordura" percent={0} grams={goals.fatsG} color={colors.protein} unitOnly />
            </View>
            <View style={styles.waterCard}>
              <Ionicons name="water" size={26} color={colors.water} />
              <View style={{ flex: 1 }}>
                <Text style={styles.waterTitle}>
                  {goals.waterMl} ml de água por dia ({glassesFromMl(goals.waterMl)} copos de {GLASS_ML} ml)
                </Text>
                <Text style={styles.waterSub}>O Nutri vai lembrá-lo de beber água ao longo do dia.</Text>
              </View>
            </View>
            <Text style={styles.hint}>{GOAL_TEXT[answers.goal]}</Text>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          disabled={!canContinue || saving}
          style={[styles.cta, (!canContinue || saving) && styles.ctaOff]}
          onPress={() => (step === RESULT_STEP ? void finish() : setStep(step + 1))}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{step === RESULT_STEP ? 'Começar' : step === TOTAL_QUESTIONS - 1 ? 'Ver o meu plano' : 'Continuar'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
  segmentOn: { backgroundColor: colors.primary },
  count: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginVertical: 6 },
  resultHead: { alignItems: 'center', gap: 4 },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 2, borderColor: 'transparent', ...shadow },
  chipOn: { borderColor: colors.primary, backgroundColor: '#F6FBEF' },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.text },
  chipTextOn: { color: colors.primaryDark },
  kcalCard: { backgroundColor: colors.lime, borderRadius: radius.card, padding: 22, alignItems: 'center' },
  kcalLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  kcalValue: { fontSize: 56, fontWeight: '800', color: colors.text, letterSpacing: -2 },
  macroRow: { flexDirection: 'row', gap: 12 },
  waterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.waterSoft, borderRadius: radius.card, padding: 16 },
  waterTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  waterSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 12, backgroundColor: colors.background },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaOff: { opacity: 0.5 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
