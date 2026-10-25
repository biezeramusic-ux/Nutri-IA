import AsyncStorage from '@react-native-async-storage/async-storage';
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
  MessageCircle,
  Play,
  Mars,
  MoreHorizontal,
  Music2,
  Search,
  Apple,
  Fish,
  Salad,
  Shuffle,
  Sprout,
  ThumbsDown,
  ThumbsUp,
  Users,
  Venus,
  Wheat,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardBase, font, radius, SCREEN_PADDING, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useProfile } from '../../hooks/useProfile';
import { GLASS_ML, calculateGoals, glassesFromMl, planTips } from '../../services/goals';
import { ensureNotificationPermission } from '../../services/notifications';
import { STAPLES } from '../../services/staples';
import { WEEK_OPTIONS, maxSafeRate, ratePerWeek, recommendedWeeks, saveGoalPlan } from '../../services/goalPlan';
import type {
  ActivityLevel,
  DietPreference,
  GoalType,
  Habits,
  HealthCondition,
  QuizAnswers,
  Sex,
} from '../../types';
import { formatMinutes, waterMinutesOfDay, waterProfileFromQuiz } from '../../services/waterReminderPlan';
import { QuizResult } from './QuizResult';
import { useAuth } from '../../hooks/useAuth';
import { MacroSquareCard } from '../MacroSquareCard';
import { NumberStepper } from './NumberStepper';
import { AgeStep, BmiStep, HeightWheel, WeightStep } from './BodySteps';
import { MaintainChart } from './MaintainChart';
import { QuizChip } from './QuizChip';
import { CrownMark } from '../CrownMark';
import { Logo } from '../Logo';
import { PotentialChart } from './PotentialChart';
import { ProcessingScreen } from './ProcessingScreen';
import { buildCoachContext, saveCoachContext, type CoachExtras } from '../../services/coachProfile';
import { QuizRow } from './QuizRow';
import { WelcomeScreen } from './WelcomeScreen';
import { YesNoRow } from './YesNoRow';
import { tr } from '../../i18n';

type Step = 'goal' | 'name' | 'sex' | 'age' | 'height' | 'weight' | 'bmi' | 'experience' | 'source' | 'trust' | 'coach' | 'dietStyle' | 'energy' | 'trainDays' | 'potential' | 'timeframe' | 'activity' | 'challenge' | 'lifestyle' | 'health' | 'habits' | 'motivation' | 'diet' | 'staples';

const FULL_STEPS: Step[] = ['goal', 'sex', 'age', 'height', 'weight', 'bmi', 'activity', 'energy', 'trainDays', 'coach', 'lifestyle', 'habits', 'challenge', 'motivation', 'trust', 'health', 'dietStyle', 'diet', 'staples'];

/** O quiz adapta-se ao objetivo: quem só quer saber as calorias responde ao mínimo. */
function stepsFor(goal: GoalType): Step[] {
  switch (goal) {
    case 'track_calories':
      return ['goal', 'sex', 'age', 'height', 'weight', 'bmi', 'activity'];
    case 'maintain':
      return ['goal', 'sex', 'age', 'height', 'weight', 'bmi', 'activity', 'energy', 'challenge', 'trust', 'health', 'dietStyle', 'diet'];
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

const SOURCES: { label: string; Icon: typeof Scale }[] = [
  { label: 'Instagram', Icon: Camera },
  { label: 'Facebook', Icon: MessageCircle },
  { label: 'TikTok', Icon: Music2 },
  { label: 'YouTube', Icon: Play },
  { label: 'Google', Icon: Search },
  { label: 'Amigo ou família', Icon: Users },
  { label: 'Outro', Icon: MoreHorizontal },
];
const DIET_STYLES: { label: string; Icon: typeof Scale }[] = [
  { label: 'Equilibrada', Icon: Scale },
  { label: 'Alimentos integrais', Icon: Wheat },
  { label: 'Mediterrânea', Icon: Salad },
  { label: 'Flexitariana', Icon: Shuffle },
  { label: 'Pescatariana', Icon: Fish },
  { label: 'Vegetariana', Icon: Apple },
  { label: 'Vegana', Icon: Sprout },
];
const TRAIN: { value: number; title: string; sub: string; dots: string }[] = [
  { value: 1, title: '0 - 2', sub: 'Exercícios de vez em quando', dots: '•' },
  { value: 4, title: '3 - 5', sub: 'Alguns treinos por semana', dots: '••' },
  { value: 6, title: '6+', sub: 'Atleta dedicado', dots: '•••' },
];
const CHALLENGES = ['Falta de tempo', 'Vontade de comer doces', 'Comer fora de horas', 'Não sei o que comer', 'Falta de motivação', 'Porções grandes', 'Beber pouca água'];
const MOTIVATIONS = ['Ver resultados rápidos', 'Melhorar a saúde', 'Aparência', 'Mais energia', 'Desporto e desempenho', 'Família'];
const SUPPORT_STYLES = ['Lembretes suaves', 'Desafios e medalhas', 'Gráficos e números'];
const MEALS_PER_DAY: { value: number; label: string }[] = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5 ou mais' },
];
const COOKING: { value: CoachExtras['cookingTime']; label: string }[] = [
  { value: 'low', label: 'Pouco tempo' },
  { value: 'normal', label: 'Tempo normal' },
  { value: 'high', label: 'Muito tempo' },
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
  name: { title: 'Como se chama?', subtitle: 'Vamos tratá-lo pelo nome na app.' },
  potential: { title: 'Tem um grande potencial para alcançar o seu objetivo' },
  challenge: { title: 'O que mais o trava?', subtitle: 'Escolha até 3. Vamos ajudá-lo a superar isso.' },
  lifestyle: { title: 'Como são as suas refeições?', subtitle: 'Para ajustar horários e sugestões à sua rotina.' },
  motivation: { title: 'O que mais o motiva?', subtitle: 'Escolha até 3 e diga-nos como prefere ser acompanhado.' },
  timeframe: { title: 'Em quanto tempo quer chegar à meta?', subtitle: 'Escolha um prazo realista para o seu peso desejado.' },
  goal: { title: 'Vamos começar pelos seus objetivos.', subtitle: 'Selecione até três metas que são mais importantes para si.' },
  sex: { title: 'Escolha o seu sexo', subtitle: 'Isto ajuda a personalizar a sua experiência.' },
  age: { title: 'Quantos anos tem?', subtitle: 'A idade ajusta o seu metabolismo. Arraste com calma.' },
  height: { title: 'Qual é a sua altura?', subtitle: 'Pode ajustar mais tarde no Perfil.' },
  weight: { title: 'E o seu peso?', subtitle: 'Sem pressa. Pode ajustar mais tarde no Perfil.' },
  bmi: { title: 'O seu ponto de partida', subtitle: 'Veja onde está hoje e para onde vamos juntos.' },
  experience: { title: 'Já experimentou outros aplicativos de controle de calorias?', subtitle: 'Sem problema se for a primeira vez, vamos passo a passo.' },
  coach: { title: 'Trabalha com um personal trainer ou nutricionista?', subtitle: 'Se sim, a app complementa o acompanhamento que já tem.' },
  dietStyle: { title: 'Segue uma dieta específica?', subtitle: 'Escolha o estilo que mais se parece com o seu.' },
  source: { title: 'Onde ouviu falar de nós?', subtitle: 'Só para sabermos como chegou até aqui.' },
  trust: { title: 'Feito para o ajudar a manter o rumo', subtitle: 'Perder peso é uma parte. Manter é o que conta.' },
  energy: { title: 'Como se sente ao longo do dia?', subtitle: 'A energia diz-nos muito sobre a sua alimentação.' },
  trainDays: { title: 'Quantos treinos faz por semana?', subtitle: 'Será usado para calibrar o seu plano personalizado.' },
  activity: { title: 'Quão ativo é no dia a dia?', subtitle: 'Quanto mais se mexe, mais calorias e água precisa.' },
  health: { title: 'Tem alguma condição de saúde?', subtitle: 'Opcional. O Nutri AI não substitui o seu médico.' },
  habits: { title: 'Os seus hábitos de hoje', subtitle: 'Sem julgamentos: serve só para o acompanhar melhor.' },
  diet: { title: 'Restrições e alergias', subtitle: 'Opcional. Escolha o que se aplica.' },
  staples: { title: 'O que come mais no dia a dia?', subtitle: 'Opcional. Ajuda-nos a sugerir melhores escolhas.' },
};

/** Quando há várias metas, a primeira desta lista é a que define as calorias. */
const GOAL_PRIORITY: GoalType[] = ['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy', 'track_calories'];

const SECTION: Record<Step, string> = {
  name: 'O seu nome',
  potential: 'O seu potencial',
  timeframe: 'O seu prazo',
  challenge: 'O seu desafio',
  lifestyle: 'Rotina',
  motivation: 'Motivação',
  goal: 'Metas',
  sex: 'Sobre si',
  age: 'Sobre si',
  height: 'Medidas',
  weight: 'Medidas',
  bmi: 'O seu ponto de partida',
  experience: 'Experiência',
  source: 'Conhecer-nos',
  coach: 'Acompanhamento',
  dietStyle: 'Estilo alimentar',
  trust: 'Resultados duradouros',
  energy: 'Energia',
  trainDays: 'Treino',
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
  const { width } = useWindowDimensions();
  const { profile, completeOnboarding, saveReminders, saveName } = useProfile();
  const { displayName, user } = useAuth();
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
  const [wake, setWake] = useState(profile?.wakeHour ?? 7);
  const [sleep, setSleep] = useState(profile?.sleepHour ?? 22);
  const [saving, setSaving] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [weeksPick, setWeeksPick] = useState<number | null>(null);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [cookingTime, setCookingTime] = useState<CoachExtras['cookingTime']>('normal');
  const [motivations, setMotivations] = useState<string[]>([]);
  const [supportStyle, setSupportStyle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [experience, setExperience] = useState('Não');
  const [energy, setEnergy] = useState('Depende do dia');
  const [trainDays, setTrainDays] = useState(4);
  const [source, setSource] = useState('');
  const [hasCoach, setHasCoach] = useState(false);
  const [dietStyle, setDietStyle] = useState('Equilibrada');
  const [name, setName] = useState(profile?.fullName || displayName || '');
  const touched = useRef(false);
  // O nome pode chegar do servidor depois de abrir o quiz: preenche uma única vez se ainda estiver vazio.
  useEffect(() => {
    const known = profile?.fullName || displayName;
    if (known) setName((prev) => prev || known);
  }, [profile?.fullName, displayName]);

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
  const steps = useMemo(() => {
    const list = [...(goalPicked ? stepsFor(base.goal) : FULL_STEPS)];
    if (mode === 'first') list.splice(1, 0, 'name', 'source', 'experience');
    if (wantsTarget) {
      const at = list.indexOf('bmi');
      if (at >= 0) list.splice(at + 1, 0, 'potential', 'timeframe');
    }
    return list;
  }, [goalPicked, base.goal, mode, wantsTarget]);
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
  const canContinue = current === 'goal' ? goalPicked : current === 'habits' ? answeredAllHabits : current === 'name' ? name.trim().length >= 2 : true;

  // Até 3 metas; a principal (que define as calorias) segue esta ordem de prioridade.
  const toggleGoal = (id: string) => {
    touched.current = true;
    const next = pickedIds.includes(id) ? pickedIds.filter((x) => x !== id) : pickedIds.length >= 3 ? pickedIds : [...pickedIds, id];
    setPickedIds(next);
    const nextGoals = GOAL_ROWS.filter((r) => next.includes(r.id)).map((r) => r.goal);
    const main = GOAL_PRIORITY.find((p) => nextGoals.includes(p));
    if (main) setBase((b) => ({ ...b, goal: main }));
  };

  const slide = useRef(new Animated.Value(0)).current;
  const dir = useRef(1);
  const busy = useRef(false);
  // A pergunta atual sai devagar para um lado e a seguinte entra suavemente do outro.
  const goTo = (next: number) => {
    if (busy.current) return;
    busy.current = true;
    dir.current = next >= step ? 1 : -1;
    Animated.timing(slide, { toValue: -dir.current * 0.45, duration: 230, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setStep(next);
      slide.setValue(dir.current);
      Animated.timing(slide, { toValue: 0, duration: 620, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start(() => {
        busy.current = false;
      });
    });
  };

  const goBack = () => {
    if (step > 0) goTo(step - 1);
    else if (mode === 'redo') router.back();
  };

  const finish = async () => {
    setSaving(true);
    try {
      await completeOnboarding(buildAnswers());
      if (user?.id) {
        const planWeeks = wantsTarget ? weeksPick ?? recommendedWeeks(base.weightKg, base.targetWeightKg, base.goal) : undefined;
        if (source) await AsyncStorage.setItem('nutria.source', source).catch(() => undefined);
        await saveCoachContext(user.id, buildCoachContext(buildAnswers(), { challenges, mealsPerDay, cookingTime, motivations, supportStyle, weeks: planWeeks, experience, energy, trainDays, hasCoach, dietStyle }, name.trim().split(' ')[0]));
      }
      if (user?.id && wantsTarget) {
        await saveGoalPlan(user.id, { weeks: weeksPick ?? recommendedWeeks(base.weightKg, base.targetWeightKg, base.goal), startMs: Date.now(), startWeightKg: base.weightKg });
      }
      const trimmed = name.trim();
      if (mode === 'first' && trimmed.length >= 2 && trimmed !== (profile?.fullName || displayName)) await saveName(trimmed).catch(() => undefined);
      // A hora de acordar e dormir (e as respostas do quiz) definem os horários dos lembretes de água.
      await saveReminders({ waterReminders: profile?.waterReminders ?? true, wakeHour: wake, sleepHour: sleep });
      // Pede a permissão para os lembretes de água só no primeiro quiz.
      if (mode === 'first' && (await ensureNotificationPermission(true))) {
        // Com a permissão dada, os lembretes de refeição ficam ligados por defeito (a pessoa pode desligar no Perfil).
        await AsyncStorage.setItem('nutria.mealReminders', '1').catch(() => undefined);
      }
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

  if (welcome) {
    return <WelcomeScreen name={name.trim().split(' ')[0] || ''} female={base.sex === 'female'} saving={saving} onStart={() => void finish()} />;
  }

  if (processing) {
    return (
      <ProcessingScreen
        onDone={() => {
          setProcessing(false);
          setStep(resultStep);
        }}
      />
    );
  }

  if (step === resultStep && answers && goals) {
    return (
      <QuizResult
        answers={answers}
        goals={goals}
        tips={tips}
        firstName={displayName.split(' ')[0] ?? ''}
        saving={saving}
        reminderTimes={waterMinutesOfDay({ wakeHour: wake, sleepHour: sleep, goalGlasses: glassesFromMl(goals.waterMl), ...waterProfileFromQuiz(answers) })
          .map(formatMinutes)
          .join(' · ')}
        onStart={() => (mode === 'first' ? setWelcome(true) : void finish())}
      />
    );
  }

  return (
    <View style={[styles.root, { overflow: 'hidden' }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: SCREEN_PADDING, paddingBottom: 130, gap: 16 }}
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

        <Animated.View
          style={{
            gap: 16,
            opacity: slide.interpolate({ inputRange: [-1, -0.45, 0, 0.45, 1], outputRange: [0, 0.2, 1, 0.2, 0] }),
            transform: [{ translateX: slide.interpolate({ inputRange: [-1, 1], outputRange: [-width, width] }) }],
          }}
        >
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

        {current === 'name' && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={tr('O seu nome')}
            placeholderTextColor={colors.textFaint}
            autoCapitalize="words"
            autoFocus
            maxLength={40}
            style={styles.nameInput}
          />
        )}

        {current === 'potential' && (
          <>
            <PotentialChart
              title={pickedGoals.includes('lose_weight') ? tr('A sua transição de peso') : tr('A sua evolução')}
              withLabel={tr('Com o Nutri AI')}
              withoutLabel={tr('Da forma tradicional')}
            />
            <Text style={styles.note}>
              {pickedGoals.includes('lose_weight')
                ? tr('Sem acompanhamento, perder peso costuma ser lento e difícil de manter. Com o Nutri AI, depois dos primeiros 7 dias o progresso acelera.')
                : tr('Sem acompanhamento, ganhar massa costuma ser lento e irregular. Com o Nutri AI, depois dos primeiros 7 dias o progresso acelera.')}
            </Text>
            <Text style={styles.note}>
              {base.weightKg} kg → {base.targetWeightKg} kg
            </Text>
          </>
        )}

        {current === 'timeframe' && (
          <>
            {WEEK_OPTIONS.map((w) => {
              const rec = recommendedWeeks(base.weightKg, base.targetWeightKg, base.goal);
              const rate = ratePerWeek(base.weightKg, base.targetWeightKg, w);
              const fast = rate > maxSafeRate(base.goal);
              const chosen = (weeksPick ?? rec) === w;
              const months = w >= 8 ? ` (≈ ${Math.round(w / 4.345)} ${tr('meses')})` : '';
              return (
                <QuizRow
                  key={w}
                  title={`${w} ${tr('semanas')}${months}`}
                  subtitle={`${rate.toFixed(2).replace('.', ',')} kg ${tr('por semana')}${w === rec ? ` · ${tr('Recomendado')}` : fast ? ` · ${tr('Ritmo muito rápido')}` : ''}`}
                  selected={chosen}
                  onPress={() => setWeeksPick(w)}
                />
              );
            })}
            <Text style={styles.note}>
              {tr('De {from} kg para {to} kg em {weeks} semanas. Chegaria por volta de {date}.', {
                from: base.weightKg,
                to: base.targetWeightKg,
                weeks: weeksPick ?? recommendedWeeks(base.weightKg, base.targetWeightKg, base.goal),
                date: new Date(Date.now() + (weeksPick ?? recommendedWeeks(base.weightKg, base.targetWeightKg, base.goal)) * 7 * 86400000).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
              })}
            </Text>
          </>
        )}

        {current === 'sex' && (
          <>
            <QuizRow title={tr('Mulher')} icon={<Venus size={20} color={colors.primary} />} selected={base.sex === 'female'} onPress={() => update('sex', 'female')} />
            <QuizRow title={tr('Homem')} icon={<Mars size={20} color={colors.primary} />} selected={base.sex === 'male'} onPress={() => update('sex', 'male')} />
          </>
        )}
        {current === 'age' && <AgeStep sex={base.sex} age={base.age} width={width - SCREEN_PADDING * 2} onChange={(v) => update('age', v)} />}
        {current === 'height' && <HeightWheel cm={base.heightCm} onChange={(v) => update('heightCm', v)} />}
        {current === 'weight' && (
          <WeightStep
            kg={base.weightKg}
            target={base.targetWeightKg}
            wantsTarget={wantsTarget}
            width={width - SCREEN_PADDING * 2}
            onKg={(v) => update('weightKg', v)}
            onTarget={(v) => update('targetWeightKg', v)}
          />
        )}
        {current === 'bmi' && <BmiStep weightKg={base.weightKg} heightCm={base.heightCm} goals={GOAL_ROWS.filter((r) => pickedIds.includes(r.id)).map((r) => r.title)} width={width - SCREEN_PADDING * 2} />}

        {current === 'experience' && (
          <>
            <QuizRow title={tr('Sim')} icon={<ThumbsUp size={18} color={colors.primary} />} selected={experience === 'Sim'} onPress={() => setExperience('Sim')} />
            <QuizRow title={tr('Não')} icon={<ThumbsDown size={18} color={colors.primary} />} selected={experience === 'Não'} onPress={() => setExperience('Não')} />
          </>
        )}
        {current === 'source' &&
          SOURCES.map((o) => (
            <QuizRow key={o.label} title={tr(o.label)} icon={<o.Icon size={18} color={colors.primary} />} selected={source === o.label} onPress={() => setSource(o.label)} />
          ))}
        {current === 'trust' && (
          <>
            <MaintainChart width={width - SCREEN_PADDING * 2} />
            <Text style={styles.note}>{tr('Com acompanhamento diário, é muito mais fácil manter os resultados depois dos primeiros meses.')}</Text>
          </>
        )}
        {current === 'coach' && (
          <>
            <QuizRow title={tr('Sim')} icon={<ThumbsUp size={18} color={colors.primary} />} selected={hasCoach} onPress={() => setHasCoach(true)} />
            <QuizRow title={tr('Não')} icon={<ThumbsDown size={18} color={colors.primary} />} selected={!hasCoach} onPress={() => setHasCoach(false)} />
          </>
        )}
        {current === 'dietStyle' &&
          DIET_STYLES.map((d) => (
            <QuizRow key={d.label} title={tr(d.label)} icon={<d.Icon size={18} color={colors.primary} />} selected={dietStyle === d.label} onPress={() => setDietStyle(d.label)} />
          ))}
        {current === 'energy' &&
          ['Cansado muitas vezes', 'Depende do dia', 'Com muita energia'].map((o) => (
            <QuizRow key={o} title={tr(o)} selected={energy === o} onPress={() => setEnergy(o)} />
          ))}
        {current === 'trainDays' &&
          TRAIN.map((t) => (
            <QuizRow key={t.value} title={t.title} subtitle={tr(t.sub)} icon={<Text style={styles.dots}>{t.dots}</Text>} selected={trainDays === t.value} onPress={() => setTrainDays(t.value)} />
          ))}

        {current === 'lifestyle' && (
          <>
            <Text style={styles.subHead}>{tr('Quantas refeições faz por dia?')}</Text>
            <View style={styles.chips}>
              {MEALS_PER_DAY.map((m) => (
                <QuizChip key={m.value} label={tr(m.label)} selected={mealsPerDay === m.value} onPress={() => setMealsPerDay(m.value)} />
              ))}
            </View>
            <Text style={styles.subHead}>{tr('Quanto tempo tem para cozinhar?')}</Text>
            <View style={styles.chips}>
              {COOKING.map((c) => (
                <QuizChip key={c.value} label={tr(c.label)} selected={cookingTime === c.value} onPress={() => setCookingTime(c.value)} />
              ))}
            </View>
          </>
        )}

        {current === 'motivation' && (
          <>
            <View style={styles.chips}>
              {MOTIVATIONS.map((m) => (
                <QuizChip
                  key={m}
                  label={tr(m)}
                  selected={motivations.includes(m)}
                  onPress={() => setMotivations((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : prev.length >= 3 ? prev : [...prev, m]))}
                />
              ))}
            </View>
            <Text style={styles.subHead}>{tr('Como prefere ser acompanhado?')}</Text>
            <View style={styles.chips}>
              {SUPPORT_STYLES.map((m) => (
                <QuizChip key={m} label={tr(m)} selected={supportStyle === m} onPress={() => setSupportStyle(m)} />
              ))}
            </View>
          </>
        )}

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

        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={goBack}
          disabled={step === 0 && mode === 'first'}
          style={[styles.backBtn, step === 0 && mode === 'first' && styles.backOff]}
          accessibilityLabel={tr('Voltar')}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Pressable
          disabled={!canContinue || saving}
          style={({ pressed }) => [styles.cta, (!canContinue || saving) && styles.ctaOff, pressed && styles.ctaPressed]}
          onPress={() => (step === steps.length - 1 ? setProcessing(true) : goTo(step + 1))}
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
  subHead: { fontSize: font.h3, fontWeight: '700', color: colors.text, marginTop: 6 },
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
  backBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backOff: { opacity: 0.35 },
  cta: { flex: 1, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaOff: { opacity: 0.45 },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '600' },
  dots: { fontSize: 18, fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  nameInput: { height: 60, borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: 18, fontSize: font.h2, fontWeight: '600', color: colors.text },
});
