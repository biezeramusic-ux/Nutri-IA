import { useRouter } from 'expo-router';
import {
  Activity,
  Camera,
  ArrowLeft,
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
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
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
import { QuizResult } from './QuizResult';
import { useAuth } from '../../hooks/useAuth';
import { MacroSquareCard } from '../MacroSquareCard';
import { NumberStepper } from './NumberStepper';
import { QuizChip } from './QuizChip';
import { CrownMark } from '../CrownMark';
import { Logo } from '../Logo';
import { QuizRow } from './QuizRow';
import { YesNoRow } from './YesNoRow';
import { tr } from '../../i18n';

type Step = 'goal' | 'about' | 'body' | 'activity' | 'health' | 'habits' | 'diet' | 'staples';

const FULL_STEPS: Step[] = ['goal', 'about', 'body', 'activity', 'health', 'habits', 'diet', 'staples'];

/** O quiz adapta-se ao objetivo: quem só quer saber as calorias responde ao mínimo. */
function stepsFor(goal: GoalType): Step[] {
  switch (goal) {
    case 'track_calories':
      return ['goal', 'about', 'body', 'activity'];
    case 'maintain':
      return ['goal', 'about', 'body', 'activity', 'health', 'diet'];
    case 'eat_healthy':
    case 'lose_weight':
    case 'gain_muscle':
    default:
      return FULL_STEPS;
  }
}

/** Metas que a pessoa pode escolher (até 3). Cada uma corresponde a um tipo de objetivo da app. */
const GOAL_ROWS: { id: string; goal: GoalType; title: string }[] = [
  { id: 'lose', goal: 'lose_weight', title: 'Perder peso' },
  { id: 'gain', goal: 'gain_muscle', title: 'Ganhar peso' },
  { id: 'muscle', goal: 'gain_muscle', title: 'Ganhar massa muscular' },
  { id: 'maintain', goal: 'maintain', title: 'Manter o meu peso' },
  { id: 'diet', goal: 'eat_healthy', title: 'Melhorar a minha alimentação' },
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
  goal: { title: 'Vamos começar pelos seus objetivos.', subtitle: 'Selecione até três metas que são mais importantes para si.' },
  about: { title: 'Fale-nos de si', subtitle: 'Usamos isto para calcular as suas calorias.' },
  body: { title: 'A sua altura e peso', subtitle: 'Pode ajustar mais tarde no Perfil.' },
  activity: { title: 'Como é o seu dia a dia?', subtitle: 'Quanto mais ativo, mais calorias e água precisa.' },
  health: { title: 'Tem alguma condição de saúde?', subtitle: 'Opcional. O Nutri IA não substitui o seu médico.' },
  habits: { title: 'Os seus hábitos', subtitle: 'Responda sim ou não.' },
  diet: { title: 'Restrições e alergias', subtitle: 'Opcional. Escolha o que se aplica.' },
  staples: { title: 'O que come mais no dia a dia?', subtitle: 'Opcional. Ajuda-nos a sugerir melhores escolhas.' },
};

/** Quando há várias metas, a primeira desta lista é a que define as calorias. */
const GOAL_PRIORITY: GoalType[] = ['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy', 'track_calories'];

const SECTION: Record<Step, string> = {
  goal: 'Metas',
  about: 'Sobre si',
  body: 'Medidas',
  activity: 'Atividade',
  health: 'Saúde',
  habits: 'Hábitos',
  diet: 'Alimentação',
  staples: 'Rotina alimentar',
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
  const { displayName } = useAuth();
  const [step, setStep] = useState(0);
  const [base, setBase] = useState<Base>(profile?.quiz ?? DEFAULTS);
  // Quem tinha escolhido "só saber as calorias" (opção retirada) volta a ver "Manter o meu peso" marcado.
  const idForGoal = (g: GoalType) => GOAL_ROWS.find((r) => r.goal === (g === 'track_calories' ? 'maintain' : g))?.id;
  const [pickedIds, setPickedIds] = useState<string[]>(() => {
    const id = profile?.quiz ? idForGoal(profile.quiz.goal) : undefined;
    return id ? [id] : [];
  });
  const pickedGoals = useMemo(() => GOAL_ROWS.filter((r) => pickedIds.includes(r.id)).map((r) => r.goal), [pickedIds]);
  const goalPicked = pickedIds.length > 0;
  const [habits, setHabits] = useState<HabitAnswers>(profile?.quiz?.habits ?? {});
  const [saving, setSaving] = useState(false);
  const touched = useRef(false);

  // Se o perfil só chegar depois de abrir o quiz (refazer), pré-carrega as respostas guardadas.
  useEffect(() => {
    if (profile?.quiz && !touched.current) {
      setBase(profile.quiz);
      setHabits(profile.quiz.habits);
      const id = idForGoal(profile.quiz.goal);
      if (id) setPickedIds([id]);
    }
  }, [profile?.quiz]);

  const update = <K extends keyof Base>(key: K, value: Base[K]) => {
    touched.current = true;
    setBase((prev) => ({ ...prev, [key]: value }));
  };

  // O peso desejado só faz sentido para quem quer perder peso ou ganhar massa.
  const wantsTarget = pickedGoals.includes('lose_weight') || pickedGoals.includes('gain_muscle');

  // Até escolher o objetivo, mostra o percurso completo; depois ajusta-se ao objetivo.
  const steps = useMemo(() => (goalPicked ? stepsFor(base.goal) : FULL_STEPS), [goalPicked, base.goal]);
  const resultStep = steps.length;

  const answeredAllHabits = HABIT_QUESTIONS.every((q) => habits[q.key] !== undefined);

  const buildAnswers = (): QuizAnswers => ({
    goal: base.goal,
    sex: base.sex,
    age: base.age,
    heightCm: base.heightCm,
    weightKg: base.weightKg,
    targetWeightKg: wantsTarget ? base.targetWeightKg : base.weightKg,
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

  const current: Step | null = step < steps.length ? steps[step] : null;
  const canContinue = current === 'goal' ? goalPicked : current === 'habits' ? answeredAllHabits : true;

  // Até 3 metas; a principal (que define as calorias) segue esta ordem de prioridade.
  const toggleGoal = (id: string) => {
    touched.current = true;
    const next = pickedIds.includes(id) ? pickedIds.filter((x) => x !== id) : pickedIds.length >= 3 ? pickedIds : [...pickedIds, id];
    setPickedIds(next);
    const nextGoals = GOAL_ROWS.filter((r) => next.includes(r.id)).map((r) => r.goal);
    const main = GOAL_PRIORITY.find((p) => nextGoals.includes(p));
    if (main) setBase((b) => ({ ...b, goal: main }));
  };

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
      const detail = e instanceof Error && e.message ? `\n\n${tr('Detalhe')}: ${e.message}` : '';
      Alert.alert(tr('Não foi possível guardar'), tr('Verifique a ligação à internet e tente novamente.') + detail);
    } finally {
      setSaving(false);
    }
  };

  const answers = step === resultStep ? buildAnswers() : null;
  const goals = answers ? calculateGoals(answers) : null;
  const tips = answers ? planTips(answers) : [];
  const copy = current ? COPY[current] : null;

  if (step === resultStep && answers && goals) {
    return (
      <QuizResult
        answers={answers}
        goals={goals}
        tips={tips}
        firstName={displayName.split(' ')[0] ?? ''}
        saving={saving}
        onStart={() => void finish()}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: SCREEN_PADDING, paddingBottom: 120, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {current === 'goal' && (
          <View style={styles.brand}>
            <Logo size={36} />
            <CrownMark size={14} />
          </View>
        )}
        <Text style={styles.section}>{current ? tr(SECTION[current]) : ''}</Text>
        <View style={styles.progress}>
          {steps.map((s, i) => (
            <View key={s} style={[styles.segment, i <= Math.min(step, steps.length - 1) && styles.segmentOn]} />
          ))}
        </View>

        {copy && (
          <View style={styles.head}>
            <Text style={styles.title}>{copy.title}</Text>
            {!!copy.subtitle && <Text style={styles.subtitle}>{copy.subtitle}</Text>}
          </View>
        )}

        {current === 'goal' &&
          GOAL_ROWS.map((g) => (
            <QuizRow key={g.id} multi title={g.title} selected={pickedIds.includes(g.id)} onPress={() => toggleGoal(g.id)} />
          ))}

        {current === 'about' && (
          <>
            <QuizRow title={tr('Mulher')} selected={base.sex === 'female'} onPress={() => update('sex', 'female')} />
            <QuizRow title={tr('Homem')} selected={base.sex === 'male'} onPress={() => update('sex', 'male')} />
            <NumberStepper label={tr('Idade')} value={base.age} unit="anos" min={10} max={100} onChange={(v) => update('age', v)} />
          </>
        )}

        {current === 'body' && (
          <>
            <NumberStepper label={tr('Altura')} value={base.heightCm} unit="cm" min={100} max={250} onChange={(v) => update('heightCm', v)} />
            <NumberStepper label={tr('Peso atual')} value={base.weightKg} unit="kg" min={30} max={300} onChange={(v) => update('weightKg', v)} />
            {wantsTarget && (
              <NumberStepper label={tr('Peso desejado')} value={base.targetWeightKg} unit="kg" min={30} max={300} onChange={(v) => update('targetWeightKg', v)} />
            )}
          </>
        )}

        {current === 'activity' &&
          ACTIVITIES.map((a) => (
            <QuizRow
              key={a.value}
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
            <QuizChip label={tr('Nenhuma')} selected={base.conditions.length === 0} onPress={() => update('conditions', [])} />
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
            <QuizChip label={tr('Sem restrições')} selected={base.diet.length === 0} onPress={() => update('diet', [])} />
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

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={goBack}
          disabled={step === 0 && mode === 'first'}
          style={[styles.backBtn, step === 0 && mode === 'first' && styles.backOff]}
          accessibilityLabel={tr('Voltar')}
        >
          <ArrowLeft size={22} color={colors.primaryDark} />
        </Pressable>
        <Pressable
          disabled={!canContinue || saving}
          style={({ pressed }) => [styles.cta, (!canContinue || saving) && styles.ctaOff, pressed && styles.ctaPressed]}
          onPress={() => setStep(step + 1)}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{step === steps.length - 1 ? 'Ver o meu plano' : 'Próximo'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  brand: { alignItems: 'center', gap: 0, marginBottom: -11 },
  section: { textAlign: 'center', fontSize: font.h3, fontWeight: '600', color: colors.text, marginBottom: 4 },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
  segmentOn: { backgroundColor: colors.primary },
  head: { gap: 4, marginTop: 8, marginBottom: 4 },
  title: { fontSize: font.h1, lineHeight: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: font.body, color: colors.textMuted, lineHeight: 20 },
  resultHead: { alignItems: 'center', gap: 6, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kcalCard: { backgroundColor: colors.lime, borderRadius: radius.card, paddingVertical: 18, alignItems: 'center' },
  note: { fontSize: font.small, color: colors.textMuted, lineHeight: 18, textAlign: 'center' },
  kcalLabel: { fontSize: font.small, fontWeight: '600', color: colors.text },
  kcalValue: { fontSize: 44, fontWeight: '700', color: colors.text, letterSpacing: -1 },
  macroRow: { flexDirection: 'row', gap: 10 },
  waterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.waterSoft, borderRadius: radius.lg, padding: 14 },
  waterTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  waterSub: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
  tips: { ...cardBase(colors), borderRadius: radius.lg, padding: 14, gap: 6 },
  tipsTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  tip: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SCREEN_PADDING, paddingTop: 10, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  backBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  backOff: { opacity: 0.35 },
  cta: { flex: 1, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaOff: { opacity: 0.45 },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '600' },
});
