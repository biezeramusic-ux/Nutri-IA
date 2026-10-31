import { Check, Pause, Play, SkipForward, Volume2, VolumeX, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { ExerciseFigure } from './ExerciseFigure';
import { font, radius, SCREEN_PADDING, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import { coachSpeak, coachStop } from '../services/coachVoice';
import type { Exercise, WorkoutPlan } from '../services/workout';

type Step =
  | { type: 'ready'; seconds: number }
  | { type: 'work'; ex: Exercise; setNo: number; sets: number; seconds?: number; reps?: string }
  | { type: 'rest'; seconds: number; next: string };

/** "30-45 s", "40 s" → 30 ou 40 segundos; "12", "10 por perna" → repetições. */
function parseSeconds(reps: string): number | null {
  const m = reps.match(/(\d+)\s*(?:-\s*\d+\s*)?(?:s|seg|sec)\b/i);
  return m ? Number(m[1]) : null;
}

function buildSteps(plan: WorkoutPlan): Step[] {
  const out: Step[] = [{ type: 'ready', seconds: 5 }];
  plan.exercises.forEach((ex, i) => {
    const secs = parseSeconds(ex.reps);
    for (let s = 1; s <= ex.sets; s++) {
      out.push({ type: 'work', ex, setNo: s, sets: ex.sets, ...(secs ? { seconds: secs } : { reps: ex.reps }) });
      const last = i === plan.exercises.length - 1 && s === ex.sets;
      if (!last) {
        const next = s < ex.sets ? ex.name : plan.exercises[i + 1].name;
        out.push({ type: 'rest', seconds: Math.max(10, ex.restSec), next });
      }
    }
  });
  return out;
}

const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/** Treino guiado: boneco animado do exercício, contagem do tempo de cada série e do descanso, e voz a dizer o que fazer a seguir. */
export function WorkoutSession({ plan, onClose, onSave }: { plan: WorkoutPlan; onClose: () => void; onSave: (minutes: number, kcal: number) => Promise<void> }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const steps = useMemo(() => buildSteps(plan), [plan]);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(steps[0].type === 'work' ? steps[0].seconds ?? 0 : (steps[0] as { seconds: number }).seconds);
  const [paused, setPaused] = useState(false);
  const [voice, setVoice] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const voiceRef = useRef(true);
  voiceRef.current = voice;

  const step = steps[i];
  const say = (t: string) => voiceRef.current && coachSpeak(t);

  const go = (n: number) => {
    if (n >= steps.length) {
      setDone(true);
      say(tr('Treino concluído. Excelente trabalho!'));
      return;
    }
    const s = steps[n];
    setI(n);
    setLeft(s.type === 'work' ? s.seconds ?? 0 : s.seconds);
    if (s.type === 'ready') say(tr('Prepare-se. O treino vai começar.'));
    else if (s.type === 'work') say(tr('{name}. Série {n} de {sets}. {reps}', { name: s.ex.name, n: s.setNo, sets: s.sets, reps: s.seconds ? tr('{s} segundos', { s: s.seconds }) : tr('{r} repetições', { r: s.reps ?? '' }) }));
    else say(tr('Descanse {s} segundos. A seguir: {name}.', { s: s.seconds, name: s.next }));
  };

  useEffect(() => {
    go(0);
    return () => coachStop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Relógio de 1 s: conta o tempo total e o tempo do passo (passos de repetições não têm contagem).
  useEffect(() => {
    if (done || paused) return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      setLeft((l) => (step.type === 'work' && !step.seconds ? 0 : l - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [done, paused, step]);

  useEffect(() => {
    const timed = step.type !== 'work' || !!step.seconds;
    if (timed && left <= 0 && !done && !paused) go(i + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const total = plan.minutes * 60;
  const kcal = Math.round(plan.kcal * Math.min(1, Math.max(0.2, elapsed / Math.max(60, total))));
  const doneMin = Math.max(1, Math.round(elapsed / 60));

  if (done) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.center}>
          <View style={styles.bigCheck}>
            <Check size={54} color="#fff" strokeWidth={3} />
          </View>
          <Text style={styles.doneTitle}>{tr('Treino concluído!')}</Text>
          <Text style={styles.muted}>
            {doneMin} min · ≈ {kcal} kcal
          </Text>
        </View>
        <Pressable
          style={[styles.cta, saved && { opacity: 0.6 }]}
          disabled={saved}
          onPress={async () => {
            await onSave(doneMin, kcal);
            setSaved(true);
          }}
        >
          <Text style={styles.ctaText}>{saved ? tr('Guardado nas calorias queimadas') : tr('Guardar nas calorias queimadas')}</Text>
        </Pressable>
        <Pressable style={styles.ghost} onPress={onClose}>
          <Text style={styles.ghostText}>{tr('Fechar')}</Text>
        </Pressable>
      </View>
    );
  }

  const work = step.type === 'work' ? step : null;
  const title = step.type === 'ready' ? tr('Prepare-se') : step.type === 'rest' ? tr('Descanso') : step.ex.name;
  const figureName = step.type === 'rest' ? step.next : work ? work.ex.name : plan.exercises[0].name;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.top}>
        <Pressable style={styles.round} onPress={onClose} accessibilityLabel={tr('Fechar')}>
          <X size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(i / (steps.length - 1)) * 100}%` }]} />
          </View>
          <Text style={styles.clock}>
            {mmss(elapsed)} / {plan.minutes} min
          </Text>
        </View>
        <Pressable
          style={styles.round}
          onPress={() => {
            if (voice) coachStop();
            setVoice((v) => !v);
          }}
          accessibilityLabel={tr('Voz do treinador')}
        >
          {voice ? <Volume2 size={20} color={colors.primary} /> : <VolumeX size={20} color={colors.textMuted} />}
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={[styles.kicker, step.type === 'rest' && { color: '#F59E0B' }]}>
          {step.type === 'rest' ? tr('A seguir') : work ? tr('Série {n} de {sets}', { n: work.setNo, sets: work.sets }) : ''}
        </Text>
        <View style={[styles.stage, step.type === 'rest' && { opacity: 0.55 }]}>
          <ExerciseFigure name={figureName} size={230} />
        </View>
        <Text style={styles.name}>{step.type === 'rest' ? step.next : title}</Text>
        {step.type === 'rest' && <Text style={styles.muted}>{tr('Respire fundo e prepare-se.')}</Text>}
        {work?.ex.tip && <Text style={styles.muted}>{work.ex.tip}</Text>}
        <Text style={step.type === 'work' && !step.seconds ? styles.bigReps : styles.big}>
          {step.type === 'work' && !step.seconds ? `${step.reps} ${tr('repetições')}` : mmss(left)}
        </Text>
      </View>

      <View style={styles.row}>
        <Pressable style={styles.sec} onPress={() => setPaused((p) => !p)}>
          {paused ? <Play size={20} color={colors.text} /> : <Pause size={20} color={colors.text} />}
          <Text style={styles.secText}>{paused ? tr('Retomar') : tr('Pausar')}</Text>
        </Pressable>
        {work && !work.seconds ? (
          <Pressable style={[styles.cta, { flex: 1.4 }]} onPress={() => go(i + 1)}>
            <Check size={20} color="#fff" strokeWidth={3} />
            <Text style={styles.ctaText}>{tr('Feito')}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.cta, { flex: 1.4 }]} onPress={() => go(i + 1)}>
            <SkipForward size={20} color="#fff" />
            <Text style={styles.ctaText}>{tr('Pular')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: SCREEN_PADDING, gap: 12 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    round: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    track: { height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
    clock: { fontSize: font.small, fontWeight: '700', color: colors.textMuted, marginTop: 4, textAlign: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    kicker: { fontSize: font.small, fontWeight: '800', letterSpacing: 1, color: colors.primary, textTransform: 'uppercase' },
    stage: { width: 270, height: 270, borderRadius: 135, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: font.h1, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 6 },
    muted: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
    big: { fontSize: 56, fontWeight: '800', color: colors.text, letterSpacing: -1, marginTop: 4 },
    bigReps: { fontSize: 34, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 4 },
    row: { flexDirection: 'row', gap: 12 },
    sec: { flex: 1, height: 56, borderRadius: radius.pill, backgroundColor: colors.surface, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
    secText: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    cta: { height: 56, borderRadius: radius.pill, backgroundColor: colors.primary, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '800' },
    ghost: { height: 50, alignItems: 'center', justifyContent: 'center' },
    ghostText: { fontSize: font.h3, fontWeight: '700', color: colors.textMuted },
    bigCheck: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    doneTitle: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 8 },
  });
