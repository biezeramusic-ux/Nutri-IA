import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  ThumbsDown,
  ThumbsUp,
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
import { TypeText } from './TypeText';
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

type Step = 'goal' | 'name' | 'about' | 'experience' | 'trust' | 'potential' | 'timeframe' | 'body' | 'activity' | 'challenge' | 'lifestyle' | 'health' | 'habits' | 'motivation' | 'diet' | 'staples';

const FULL_STEPS: Step[] = ['goal', 'about', 'body', 'activity', 'lifestyle', 'habits', 'challenge', 'motivation', 'trust', 'health', 'diet', 'staples'];

/** O quiz adapta-se ao objetivo: quem só quer saber as calorias responde ao mínimo. */
function stepsFor(goal: GoalType): Step[] {
  switch (goal) {
    case 'track_calories':
      return ['goal', 'about', 'body', 'activity', 'trust'];
    case 'maintain':
      return ['goal', 'about', 'body', 'activity', 'challenge', 'trust', 'health', 'diet'];
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

const CHALLENGES = ['Falta de tempo', 'Vontade de comer doces', 'Comer fora de horas', 'Não sei o que comer', 'Falta de motivação', 'Porções grandes', 'Beber pouca água'];
const MOTIVATIONS = ['Ver resultados rápidos', 'Melhorar a saúde', 'Aparência', 'Mais energia', 'Desporto e desempenho', 'Família'];
const SUPPORT_STYLES = ['Lembretes suaves', 'Desafios e medalhas', 'Gráficos e números'];
const MEALS_PER_DAY: { value: number; label: string }[] = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5 ou mais' },
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
  experience: { title: 'Já experimentou outros aplicativos de controle de calorias?', subtitle: 'Sem problema se for a primeira vez, vamos passo a passo.' },
  trust: { title: 'Feito para o ajudar a manter o rumo', subtitle: 'Perder peso é uma parte. Manter é o que conta.' },
  timeframe: { title: 'Em quanto tempo quer chegar à meta?', subtitle: 'Escolha um prazo realista para o seu peso desejado.' },
  goal: { title: 'Vamos começar pelos seus objetivos.', subtitle: 'Selecione até três metas que são mais importantes para si.' },
  about: { title: 'Vamos conhecê-lo melhor', subtitle: 'O sexo e a idade mudam as calorias de que o corpo precisa.' },
  body: { title: 'As suas medidas', subtitle: 'Altura e peso são a base do seu plano. Pode ajustar depois no Perfil.' },
  activity: { title: 'Quão ativo é no dia a dia?', subtitle: 'Quanto mais se mexe, mais calorias e água precisa.' },
  health: { title: 'Tem alguma condição de saúde?', subtitle: 'Opcional. O Nutri AI não substitui o seu médico.' },
  habits: { title: 'Os seus hábitos de hoje', subtitle: 'Sem julgamentos: serve só para o acompanhar melhor.' },
  diet: { title: 'Restrições e alergias', subtitle: 'Opcional. Escolha o que se aplica.' },
  staples: { title: 'O que come mais no dia a dia?', subtitle: 'Opcional. Ajuda-nos a sugerir melhores escolhas.' },
};

/** Quando há várias metas, a primeira desta lista é a que define as calorias. */
const GOAL_PRIORITY: GoalType[] = ['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy', 'track_calories'];

/** Os passos agrupam-se por tema: a barra de progresso e o título mostram em que grupo a pessoa está. */
const GROUP: Record<Step, string> = {
  goal: 'Começar',
  name: 'Começar',
  experience: 'Começar',
  about: 'Sobre si',
  body: 'Sobre si',
  potential: 'Sobre si',
  timeframe: 'Sobre si',
  activity: 'A sua rotina',
  lifestyle: 'A sua rotina',
  habits: 'A sua rotina',
  challenge: 'Motivação',
  motivation: 'Motivação',
  trust: 'Motivação',
  health: 'Saúde e alimentação',
  diet: 'Saúde e alimentação',
  staples: 'Saúde e alimentação',
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
  const cookingTime: CoachExtras['cookingTime'] = 'normal';
  const [motivations, setMotivations] = useState<string[]>([]);
  const [supportStyle, setSupportStyle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [experience, setExperience] = useState('Não');
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
    list.splice(1, 0, ...(mode === 'first' ? (['name', 'experience'] as Step[]) : (['experience'] as Step[])));
    if (wantsTarget) {
      const at = list.indexOf('body');
      if (at >= 0) list.splice(at + 1, 0, 'potential', 'timeframe');
    }
    return list;
  }, [goalPicked, base.goal, mode, wantsTarget]);
  const resultStep = steps.length;
  const groups = useMemo(() => {
    const out: { name: string; start: number; size: number }[] = [];
    steps.forEach((st, i) => {
      const last = out[out.length - 1];
      if (last && last.name === GROUP[st]) last.size += 1;
      else out.push({ name: GROUP[st], start: i, size: 1 });
    });
    return out;
  }, [steps]);

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

  const slide = useRef(new Animated.Value(1)).current;
  const dir = useRef(1);
  const goTo = (next: number) => {
    dir.current = next >= step ? 1 : -1;
    slide.setValue(0);
    setStep(next);
    Animated.timing(slide, { toValue: 1, duration: 480, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
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
        await saveCoachContext(user.id, buildCoachContext(buildAnswers(), { challenges, mealsPerDay, cookingTime, motivations, supportStyle, weeks: planWeeks, experience }, name.trim().split(' ')[0]));
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
        <View style={styles.sectionRow}>
          <Text style={styles.section}>{current ? tr(GROUP[current]) : ''}</Text>
          <Text style={styles.count}>
            {Math.min(step + 1, steps.length)} / {steps.length}
          </Text>
        </View>
        <View style={styles.progress}>
          {groups.map((g) => {
            const done = Math.max(0, Math.min(g.size, step + 1 - g.start));
            return (
              <View key={g.name + g.start} style={[styles.segment, { flex: g.size }]}>
                <View style={[styles.segmentOn, { width: `${(done / g.size) * 100}%` }]} />
              </View>
            );
          })}
        </View>

        <Animated.View
          style={{
            gap: 12,
            opacity: slide.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
            transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [dir.current * width, 0] }) }],
          }}
        >
        {copy && (
          <View style={styles.head}>
            <TypeText key={`t-${current}`} text={tr(copy.title)} style={styles.title} />
            {!!copy.subtitle && <TypeText key={`s-${current}`} text={tr(copy.subtitle)} style={styles.subtitle} delay={350 + copy.title.length * 38} msPerChar={16} />}
          </View>
        )}

        {current === 'experience' && (
          <>
            <QuizRow title={tr('Sim')} icon={<ThumbsUp size={18} color={colors.primary} />} selected={experience === 'Sim'} onPress={() => setExperience('Sim')} />
            <QuizRow title={tr('Não')} icon={<ThumbsDown size={18} color={colors.primary} />} selected={experience === 'Não'} onPress={() => setExperience('Não')} />
          </>
        )}
        {current === 'trust' && (
          <>
            <MaintainChart width={width - SCREEN_PADDING * 2} />
            <Text style={styles.note}>{tr('Com acompanhamento diário, é muito mais fácil manter os resultados depois dos primeiros meses.')}</Text>
          </>
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

        {current === 'activity' && (
          <>
            {ACTIVITIES.map((a) => (
              <QuizRow
                key={a.value}
                title={a.title}
                subtitle={a.subtitle}
                selected={base.activity === a.value}
                onPress={() => update('activity', a.value)}
              />
            ))}
            <NumberStepper label={tr('Acordo às (hora)')} value={wake} unit="h" min={4} max={12} onChange={setWake} />
            <NumberStepper label={tr('Vou dormir às (hora)')} value={sleep} unit="h" min={18} max={24} onChange={setSleep} />
          </>
        )}

        {current === 'challenge' && (
          <View style={styles.chips}>
            {CHALLENGES.map((c) => (
              <QuizChip
                key={c}
                label={tr(c)}
                selected={challenges.includes(c)}
                onPress={() => {
                  touched.current = true;
                  setChallenges((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : prev.length >= 3 ? prev : [...prev, c]));
                }}
              />
            ))}
          </View>
        )}

        {current === 'lifestyle' && (
          <>
            <Text style={styles.subHead}>{tr('Quantas refeições faz por dia?')}</Text>
            <View style={styles.chips}>
              {MEALS_PER_DAY.map((m) => (
                <QuizChip key={m.value} label={tr(m.label)} selected={mealsPerDay === m.value} onPress={() => setMealsPerDay(m.value)} />
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
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 },
  section: { fontSize: font.h3, fontWeight: '700', color: colors.primary },
  count: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
  progress: { flexDirection: 'row', gap: 5 },
  segment: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  segmentOn: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
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
  nameInput: { height: 60, borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: 18, fontSize: font.h2, fontWeight: '600', color: colors.text },
});
