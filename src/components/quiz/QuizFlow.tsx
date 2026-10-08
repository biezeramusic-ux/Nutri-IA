import { useRouter } from 'expo-router';
import {
  Activity,
  Camera,
  ChevronLeft,
  Droplets,
  Dumbbell,
  Footprints,
  HeartPulse,
  Leaf,
  Scale,
  Sofa,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardBase, font, radius, SCREEN_PADDING, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useProfile } from '../../hooks/useProfile';
import { GLASS_ML, calculateGoals, glassesFromMl, planTips } from '../../services/goals';
import { ensureNotificationPermission } from '../../services/notifications';
import { STAPLES } from '../../services/staples';
import type {
  ActivityLevel,
  DietPreference,
  GoalType,
  Habits,
  HealthCondition,
  QuizAnswers,
  Sex,
} from '../../types';
import { Logo } from '../Logo';
import { MacroSquareCard } from '../MacroSquareCard';
import { NumberStepper } from './NumberStepper';
import { QuizChip } from './QuizChip';
import { QuizOption } from './QuizOption';
import { YesNoRow } from './YesNoRow';

const STEPS = ['goal', 'about', 'body', 'activity', 'health', 'habits', 'diet', 'staples'] as const;
type Step = (typeof STEPS)[number];
const RESULT_STEP = STEPS.length;

const GOALS: { value: GoalType; icon: typeof Scale; title: string; subtitle: string }[] = [
  { value: 'lose_weight', icon: Scale, title: 'Perder peso', subtitle: 'Défice calórico saudável' },
  { value: 'track_calories', icon: Camera, title: 'Saber as calorias dos meus pratos', subtitle: 'Scanner e diário alimentar' },
  { value: 'maintain', icon: HeartPulse, title: 'Manter o meu peso', subtitle: 'Equilíbrio no dia a dia' },
  { value: 'gain_muscle', icon: Dumbbell, title: 'Ganhar massa muscular', subtitle: 'Mais proteína e energia' },
  { value: 'eat_healthy', icon: Leaf, title: 'Comer mais saudável', subtitle: 'Melhores escolhas' },
];

const ACTIVITIES: { value: ActivityLevel; icon: typeof Scale; title: string; subtitle: string }[] = [
  { value: 'sedentary', icon: Sofa, title: 'Pouco ativo', subtitle: 'Trabalho sentado, quase sem exercício' },
  { value: 'light', icon: Footprints, title: 'Ligeiramente ativo', subtitle: 'Exercício 1 a 3 vezes por semana' },
  { value: 'moderate', icon: Activity, title: 'Moderadamente ativo', subtitle: 'Exercício 3 a 5 vezes por semana' },
  { value: 'very_active', icon: Dumbbell, title: 'Muito ativo', subtitle: 'Treino intenso ou trabalho físico' },
];

const CONDITIONS: { value: HealthCondition; label: string }[] = [
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hypertension', label: 'Tensão alta' },
  { value: 'high_cholesterol', label: 'Colesterol alto' },
  { value: 'pregnancy', label: 'Gravidez ou amamentação' },
];

const HABIT_QUESTIONS: { key: keyof Habits; text: string }[] = [
  { key: 'skipsMeals', text: 'Costuma saltar refeições?' },
  { key: 'eatsOut', text: 'Come fora de casa mais de 3 vezes por semana?' },
  { key: 'sugaryDrinks', text: 'Bebe refrigerantes ou sumos açucarados todos os dias?' },
  { key: 'eatsFruitVeg', text: 'Come fruta ou legumes todos os dias?' },
  { key: 'drinksEnoughWater', text: 'Bebe pelo menos 6 copos de água por dia?' },
];

const DIETS: { value: DietPreference; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetariano' },
  { value: 'vegan', label: 'Vegano' },
  { value: 'gluten_free', label: 'Sem glúten' },
  { value: 'lactose_free', label: 'Sem lactose' },
  { value: 'halal', label: 'Halal' },
  { value: 'no_pork', label: 'Sem carne de porco' },
  { value: 'peanut_allergy', label: 'Alergia a amendoim' },
  { value: 'shellfish_allergy', label: 'Alergia a marisco' },
];

const COPY: Record<Step, { title: string; subtitle?: string }> = {
  goal: { title: 'O que veio procurar no Nutri IA?', subtitle: 'Vamos adaptar tudo ao seu objetivo.' },
  about: { title: 'Fale-nos de si', subtitle: 'Usamos isto para calcular as suas calorias.' },
  body: { title: 'A sua altura e peso', subtitle: 'Pode ajustar mais tarde no Perfil.' },
  activity: { title: 'Como é o seu dia a dia?', subtitle: 'Quanto mais ativo, mais calorias e água precisa.' },
  health: { title: 'Tem alguma condição de saúde?', subtitle: 'Opcional. O Nutri IA não substitui o seu médico.' },
  habits: { title: 'Os seus hábitos', subtitle: 'Responda sim ou não.' },
  diet: { title: 'Restrições e alergias', subtitle: 'Opcional. Escolha o que se aplica.' },
  staples: { title: 'O que come mais no dia a dia?', subtitle: 'Opcional. Ajuda-nos a sugerir melhores escolhas.' },
};

type Base = Omit<QuizAnswers, 'habits'>;

const DEFAULTS: Base = {
  goal: 'track_calories',
  sex: 'female' as Sex,
  age: 25,
  heightCm: 165,
  weightKg: 65,
  targetWeightKg: 60,
  activity: 'light',
  conditions: [],
  diet: [],
  staples: [],
};

type HabitAnswers = Partial<Record<keyof Habits, boolean>>;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function QuizFlow({ mode }: { mode: 'first' | 'redo' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, completeOnboarding } = useProfile();
  const [step, setStep] = useState(0);
  const [base, setBase] = useState<Base>(profile?.quiz ?? DEFAULTS);
  const [goalPicked, setGoalPicked] = useState(!!profile?.quiz);
  const [habits, setHabits] = useState<HabitAnswers>(profile?.quiz?.habits ?? {});
  const [saving, setSaving] = useState(false);
  const touched = useRef(false);

  // Se o perfil só chegar depois de abrir o quiz (refazer), pré-carrega as respostas guardadas.
  useEffect(() => {
    if (profile?.quiz && !touched.current) {
      setBase(profile.quiz);
      setHabits(profile.quiz.habits);
      setGoalPicked(true);
    }
  }, [profile?.quiz]);

  const update = <K extends keyof Base>(key: K, value: Base[K]) => {
    touched.current = true;
    setBase((prev) => ({ ...prev, [key]: value }));
  };

  const answeredAllHabits = HABIT_QUESTIONS.every((q) => habits[q.key] !== undefined);

  const buildAnswers = (): QuizAnswers => ({
    goal: base.goal,
    sex: base.sex,
    age: base.age,
    heightCm: base.heightCm,
    weightKg: base.weightKg,
    targetWeightKg: base.targetWeightKg,
    activity: base.activity,
    conditions: base.conditions,
    habits: {
      skipsMeals: habits.skipsMeals ?? false,
      eatsOut: habits.eatsOut ?? false,
      sugaryDrinks: habits.sugaryDrinks ?? false,
      eatsFruitVeg: habits.eatsFruitVeg ?? true,
      drinksEnoughWater: habits.drinksEnoughWater ?? true,
    },
    diet: base.diet,
    staples: base.staples,
  });

  const current: Step | null = step < STEPS.length ? STEPS[step] : null;
  const canContinue = current === 'goal' ? goalPicked : current === 'habits' ? answeredAllHabits : true;

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else if (mode === 'redo') router.back();
  };

  const finish = async () => {
    setSaving(true);
    try {
      await completeOnboarding(buildAnswers());
      // Pede a permissão para os lembretes de água só no primeiro quiz.
      if (mode === 'first') await ensureNotificationPermission(true);
      router.replace('/');
    } catch (e) {
      const detail = e instanceof Error && e.message ? `\n\nDetalhe: ${e.message}` : '';
      Alert.alert('Não foi possível guardar', `Verifique a ligação à internet e tente novamente.${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const answers = step === RESULT_STEP ? buildAnswers() : null;
  const goals = answers ? calculateGoals(answers) : null;
  const tips = answers ? planTips(answers) : [];
  const copy = current ? COPY[current] : null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: SCREEN_PADDING, paddingBottom: 120, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={goBack}
            style={[styles.back, step === 0 && mode === 'first' && styles.hidden]}
            disabled={step === 0 && mode === 'first'}
            accessibilityLabel="Voltar"
          >
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>
          <View style={styles.progress}>
            {STEPS.map((s, i) => (
              <View key={s} style={[styles.segment, i <= Math.min(step, STEPS.length - 1) && styles.segmentOn]} />
            ))}
          </View>
          <Text style={styles.count}>
            {Math.min(step + 1, STEPS.length)}/{STEPS.length}
          </Text>
        </View>

        {copy ? (
          <View style={styles.head}>
            <Text style={styles.title}>{copy.title}</Text>
            {!!copy.subtitle && <Text style={styles.subtitle}>{copy.subtitle}</Text>}
          </View>
        ) : (
          <View style={styles.resultHead}>
            <Logo size={52} />
            <Text style={styles.title}>O seu plano está pronto</Text>
          </View>
        )}

        {current === 'goal' &&
          GOALS.map((g) => (
            <QuizOption
              key={g.value}
              icon={g.icon}
              title={g.title}
              subtitle={g.subtitle}
              selected={goalPicked && base.goal === g.value}
              onPress={() => {
                update('goal', g.value);
                setGoalPicked(true);
              }}
            />
          ))}

        {current === 'about' && (
          <>
            <QuizOption icon={UserRound} title="Mulher" selected={base.sex === 'female'} onPress={() => update('sex', 'female')} />
            <QuizOption icon={UserRound} title="Homem" selected={base.sex === 'male'} onPress={() => update('sex', 'male')} />
            <NumberStepper label="Idade" value={base.age} unit="anos" min={10} max={100} onChange={(v) => update('age', v)} />
          </>
        )}

        {current === 'body' && (
          <>
            <NumberStepper label="Altura" value={base.heightCm} unit="cm" min={100} max={250} onChange={(v) => update('heightCm', v)} />
            <NumberStepper label="Peso atual" value={base.weightKg} unit="kg" min={30} max={300} onChange={(v) => update('weightKg', v)} />
            <NumberStepper label="Peso desejado" value={base.targetWeightKg} unit="kg" min={30} max={300} onChange={(v) => update('targetWeightKg', v)} />
          </>
        )}

        {current === 'activity' &&
          ACTIVITIES.map((a) => (
            <QuizOption
              key={a.value}
              icon={a.icon}
              title={a.title}
              subtitle={a.subtitle}
              selected={base.activity === a.value}
              onPress={() => update('activity', a.value)}
            />
          ))}

        {current === 'health' && (
          <View style={styles.chips}>
            {CONDITIONS.map((c) => (
              <QuizChip
                key={c.value}
                label={c.label}
                selected={base.conditions.includes(c.value)}
                onPress={() => update('conditions', toggle(base.conditions, c.value))}
              />
            ))}
            <QuizChip label="Nenhuma" selected={base.conditions.length === 0} onPress={() => update('conditions', [])} />
          </View>
        )}

        {current === 'habits' &&
          HABIT_QUESTIONS.map((q) => (
            <YesNoRow
              key={q.key}
              question={q.text}
              value={habits[q.key]}
              onChange={(v) => {
                touched.current = true;
                setHabits((prev) => ({ ...prev, [q.key]: v }));
              }}
            />
          ))}

        {current === 'diet' && (
          <View style={styles.chips}>
            {DIETS.map((d) => (
              <QuizChip
                key={d.value}
                label={d.label}
                selected={base.diet.includes(d.value)}
                onPress={() => update('diet', toggle(base.diet, d.value))}
              />
            ))}
            <QuizChip label="Sem restrições" selected={base.diet.length === 0} onPress={() => update('diet', [])} />
          </View>
        )}

        {current === 'staples' && (
          <View style={styles.chips}>
            {STAPLES.map((s) => (
              <QuizChip
                key={s.id}
                label={s.label}
                selected={base.staples.includes(s.id)}
                onPress={() => update('staples', toggle(base.staples, s.id))}
              />
            ))}
          </View>
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
              <Droplets size={22} color={colors.water} />
              <View style={{ flex: 1 }}>
                <Text style={styles.waterTitle}>{goals.waterMl} ml de água por dia</Text>
                <Text style={styles.waterSub}>
                  {glassesFromMl(goals.waterMl)} copos de {GLASS_ML} ml. O Nutri IA vai lembrá-lo de beber.
                </Text>
              </View>
            </View>
            {tips.length > 0 && (
              <View style={styles.tips}>
                <Text style={styles.tipsTitle}>Para si</Text>
                {tips.map((t) => (
                  <Text key={t} style={styles.tip}>
                    • {t}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          disabled={!canContinue || saving}
          style={({ pressed }) => [styles.cta, (!canContinue || saving) && styles.ctaOff, pressed && styles.ctaPressed]}
          onPress={() => (step === RESULT_STEP ? void finish() : setStep(step + 1))}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>
              {step === RESULT_STEP ? 'Começar' : step === STEPS.length - 1 ? 'Ver o meu plano' : 'Continuar'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  segmentOn: { backgroundColor: colors.primary },
  count: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
  head: { gap: 4, marginTop: 8, marginBottom: 4 },
  title: { fontSize: font.h1, lineHeight: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: font.body, color: colors.textMuted, lineHeight: 20 },
  resultHead: { alignItems: 'center', gap: 6, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kcalCard: { backgroundColor: colors.lime, borderRadius: radius.card, paddingVertical: 18, alignItems: 'center' },
  kcalLabel: { fontSize: font.small, fontWeight: '600', color: colors.text },
  kcalValue: { fontSize: 44, fontWeight: '700', color: colors.text, letterSpacing: -1 },
  macroRow: { flexDirection: 'row', gap: 10 },
  waterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.waterSoft, borderRadius: radius.lg, padding: 14 },
  waterTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  waterSub: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
  tips: { ...cardBase(colors), borderRadius: radius.lg, padding: 14, gap: 6 },
  tipsTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  tip: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SCREEN_PADDING, paddingTop: 10, backgroundColor: colors.background },
  cta: { height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaOff: { opacity: 0.45 },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '600' },
});
