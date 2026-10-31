import { useEffect, useState } from 'react';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

/** Pontos do boneco: cabeça, pescoço, anca, cotovelos e mãos (E/D), joelhos e pés (E/D). Coordenadas num quadro 120×120. */
type P = [number, number];
interface Pose {
  head: P;
  neck: P;
  hip: P;
  eL: P;
  hL: P;
  eR: P;
  hR: P;
  kL: P;
  fL: P;
  kR: P;
  fR: P;
}

const stand: Pose = { head: [60, 16], neck: [60, 30], hip: [60, 62], eL: [46, 46], hL: [44, 62], eR: [74, 46], hR: [76, 62], kL: [55, 84], fL: [53, 106], kR: [65, 84], fR: [67, 106] };

export type Move = 'squat' | 'pushup' | 'lunge' | 'bridge' | 'plank' | 'jack' | 'knees' | 'climber' | 'press' | 'row' | 'crunch' | 'stretch' | 'march';

const MOVES: Record<Move, [Pose, Pose]> = {
  squat: [
    stand,
    { head: [60, 38], neck: [60, 52], hip: [60, 82], eL: [48, 58], hL: [42, 52], eR: [72, 58], hR: [78, 52], kL: [44, 88], fL: [50, 106], kR: [76, 88], fR: [70, 106] },
  ],
  pushup: [
    { head: [100, 34], neck: [90, 42], hip: [52, 58], eL: [90, 58], hL: [90, 74], eR: [90, 58], hR: [90, 74], kL: [34, 64], fL: [16, 72], kR: [34, 64], fR: [16, 72] },
    { head: [100, 60], neck: [90, 64], hip: [52, 70], eL: [76, 72], hL: [90, 74], eR: [76, 72], hR: [90, 74], kL: [34, 72], fL: [16, 74], kR: [34, 72], fR: [16, 74] },
  ],
  lunge: [
    stand,
    { head: [60, 28], neck: [60, 42], hip: [60, 72], eL: [48, 56], hL: [46, 70], eR: [72, 56], hR: [74, 70], kL: [42, 82], fL: [38, 106], kR: [76, 94], fR: [90, 106] },
  ],
  bridge: [
    { head: [14, 92], neck: [26, 94], hip: [58, 98], eL: [38, 98], hL: [52, 100], eR: [38, 98], hR: [52, 100], kL: [78, 74], fL: [90, 102], kR: [78, 74], fR: [90, 102] },
    { head: [14, 92], neck: [26, 92], hip: [58, 74], eL: [38, 96], hL: [52, 100], eR: [38, 96], hR: [52, 100], kL: [78, 70], fL: [90, 102], kR: [78, 70], fR: [90, 102] },
  ],
  plank: [
    { head: [100, 52], neck: [90, 58], hip: [52, 66], eL: [88, 76], hL: [102, 78], eR: [88, 76], hR: [102, 78], kL: [34, 70], fL: [16, 76], kR: [34, 70], fR: [16, 76] },
    { head: [100, 50], neck: [90, 56], hip: [52, 63], eL: [88, 76], hL: [102, 78], eR: [88, 76], hR: [102, 78], kL: [34, 68], fL: [16, 76], kR: [34, 68], fR: [16, 76] },
  ],
  jack: [
    { head: [60, 16], neck: [60, 30], hip: [60, 62], eL: [48, 48], hL: [46, 64], eR: [72, 48], hR: [74, 64], kL: [57, 84], fL: [56, 106], kR: [63, 84], fR: [64, 106] },
    { head: [60, 16], neck: [60, 30], hip: [60, 62], eL: [40, 22], hL: [32, 6], eR: [80, 22], hR: [88, 6], kL: [46, 84], fL: [34, 106], kR: [74, 84], fR: [86, 106] },
  ],
  knees: [
    { head: [60, 16], neck: [60, 30], hip: [60, 62], eL: [48, 46], hL: [54, 56], eR: [72, 46], hR: [66, 62], kL: [52, 62], fL: [52, 80], kR: [65, 84], fR: [67, 106] },
    { head: [60, 16], neck: [60, 30], hip: [60, 62], eL: [48, 46], hL: [54, 62], eR: [72, 46], hR: [66, 56], kL: [55, 84], fL: [53, 106], kR: [68, 62], fR: [68, 80] },
  ],
  climber: [
    { head: [100, 40], neck: [90, 46], hip: [54, 60], eL: [90, 62], hL: [90, 76], eR: [90, 62], hR: [90, 76], kL: [72, 66], fL: [76, 76], kR: [34, 68], fR: [16, 76] },
    { head: [100, 40], neck: [90, 46], hip: [54, 60], eL: [90, 62], hL: [90, 76], eR: [90, 62], hR: [90, 76], kL: [34, 68], fL: [16, 76], kR: [72, 66], fR: [76, 76] },
  ],
  press: [
    { head: [60, 16], neck: [60, 30], hip: [60, 62], eL: [40, 44], hL: [40, 28], eR: [80, 44], hR: [80, 28], kL: [55, 84], fL: [53, 106], kR: [65, 84], fR: [67, 106] },
    { head: [60, 16], neck: [60, 30], hip: [60, 62], eL: [46, 22], hL: [52, 4], eR: [74, 22], hR: [68, 4], kL: [55, 84], fL: [53, 106], kR: [65, 84], fR: [67, 106] },
  ],
  row: [
    { head: [86, 36], neck: [78, 44], hip: [44, 62], eL: [80, 62], hL: [82, 80], eR: [80, 62], hR: [82, 80], kL: [44, 86], fL: [42, 106], kR: [44, 86], fR: [42, 106] },
    { head: [86, 36], neck: [78, 44], hip: [44, 62], eL: [62, 62], hL: [76, 60], eR: [62, 62], hR: [76, 60], kL: [44, 86], fL: [42, 106], kR: [44, 86], fR: [42, 106] },
  ],
  crunch: [
    { head: [20, 90], neck: [32, 92], hip: [62, 98], eL: [28, 90], hL: [22, 84], eR: [28, 90], hR: [22, 84], kL: [82, 74], fL: [92, 102], kR: [82, 74], fR: [92, 102] },
    { head: [40, 74], neck: [44, 82], hip: [62, 98], eL: [50, 70], hL: [48, 62], eR: [50, 70], hR: [48, 62], kL: [82, 74], fL: [92, 102], kR: [82, 74], fR: [92, 102] },
  ],
  stretch: [
    stand,
    { head: [60, 14], neck: [60, 28], hip: [60, 62], eL: [44, 18], hL: [52, 4], eR: [76, 18], hR: [68, 4], kL: [55, 84], fL: [53, 106], kR: [65, 84], fR: [67, 106] },
  ],
  march: [
    stand,
    { head: [60, 16], neck: [60, 30], hip: [60, 62], eL: [46, 50], hL: [46, 66], eR: [74, 44], hR: [76, 58], kL: [55, 84], fL: [53, 106], kR: [68, 68], fR: [68, 84] },
  ],
};

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Escolhe o movimento pelo nome do exercício (português, inglês, espanhol, francês...). */
export function moveFor(name: string): Move {
  const n = strip(name);
  const has = (...k: string[]) => k.some((x) => n.includes(x));
  if (has('polichinelo', 'jumping', 'jack', 'saltos de estrela', 'sauts')) return 'jack';
  if (has('alpinista', 'climber', 'escalador', 'grimpeur')) return 'climber';
  if (has('joelhos altos', 'high knee', 'rodillas altas', 'genoux', 'corrida no lugar', 'marcha')) return has('marcha') ? 'march' : 'knees';
  if (has('flexo', 'push', 'pompe', 'liegestutz', 'supino')) return 'pushup';
  if (has('prancha', 'plank', 'plancha', 'planche')) return 'plank';
  if (has('agacha', 'squat', 'sentadilla', 'accroupi')) return 'squat';
  if (has('afundo', 'lunge', 'zancada', 'fente', 'passada')) return 'lunge';
  if (has('ponte', 'bridge', 'puente', 'pont', 'gluteo', 'glute')) return 'bridge';
  if (has('desenvolvimento', 'press', 'ombro', 'shoulder', 'hombro', 'epaule')) return 'press';
  if (has('remada', 'row', 'remo', 'tirage', 'puxada')) return 'row';
  if (has('abdominal', 'crunch', 'roll-up', 'roll up', 'dead bug', 'hundred', 'nadador', 'swimmer')) return 'crunch';
  if (has('alonga', 'stretch', 'estir', 'etire', 'gato', 'cat', 'circulos', 'rotacao', 'mobil')) return 'stretch';
  return 'march';
}

// Um único relógio para todos os bonecos do ecrã (em vez de um por boneco).
let tick = 0;
let raf = 0;
const subs = new Set<(t: number) => void>();
function start() {
  if (raf) return;
  const step = () => {
    tick = Date.now();
    subs.forEach((f) => f(tick));
    raf = subs.size ? requestAnimationFrame(step) : 0;
  };
  raf = requestAnimationFrame(step);
}
function useClock(): number {
  const [t, setT] = useState(Date.now());
  useEffect(() => {
    subs.add(setT);
    start();
    return () => {
      subs.delete(setT);
    };
  }, []);
  return t;
}

const lerp = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** Boneco animado que repete o movimento do exercício, para a pessoa ver o que fazer. */
export function ExerciseFigure({ name, size = 120, color, period = 1600 }: { name: string; size?: number; color?: string; period?: number }) {
  const { colors } = useTheme();
  const t = useClock();
  const [A, B] = MOVES[moveFor(name)];
  const phase = (Math.sin(((t % period) / period) * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0 → 1 → 0, suave
  const pose = {} as Pose;
  (Object.keys(A) as (keyof Pose)[]).forEach((k) => {
    pose[k] = lerp(A[k], B[k], phase);
  });
  const c = color ?? colors.primary;
  const w = 6;
  const seg = (a: P, b: P, key: string) => <Line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Line x1={6} y1={110} x2={114} y2={110} stroke={colors.border} strokeWidth={3} strokeLinecap="round" />
      {seg(pose.neck, pose.hip, 'torso')}
      {seg(pose.neck, pose.eL, 'a1')}
      {seg(pose.eL, pose.hL, 'a2')}
      {seg(pose.neck, pose.eR, 'a3')}
      {seg(pose.eR, pose.hR, 'a4')}
      {seg(pose.hip, pose.kL, 'l1')}
      {seg(pose.kL, pose.fL, 'l2')}
      {seg(pose.hip, pose.kR, 'l3')}
      {seg(pose.kR, pose.fR, 'l4')}
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={10} fill={c} />
    </Svg>
  );
}
