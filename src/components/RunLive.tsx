import { Pause, Play, Square, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { RouteMap } from './RouteMap';
import { font, radius } from '../constants/theme';
import { formatHMS } from '../hooks/useFasting';
import { tr } from '../i18n';
import { coachSpeak, coachStop } from '../services/coachVoice';
import { formatKm, formatPace, type RoutePoint } from '../services/walks';

interface Props {
  points: RoutePoint[];
  distanceM: number;
  elapsedMs: number;
  steps: number;
  kcal: number;
  paused: boolean;
  name?: string;
  width: number;
  onTogglePause: () => void;
  onFinish: () => void;
}

/** Ritmo dos últimos ~60 s (mais reativo do que a média da corrida inteira). */
function recentPace(points: RoutePoint[]): string {
  if (points.length < 2) return '--';
  const last = points[points.length - 1];
  let i = points.length - 1;
  while (i > 0 && last.t - points[i - 1].t <= 60000) i--;
  let d = 0;
  for (let k = i; k < points.length - 1; k++) {
    const a = points[k];
    const b = points[k + 1];
    const r = (x: number) => (x * Math.PI) / 180;
    const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
    d += 2 * 6371000 * Math.asin(Math.sqrt(h));
  }
  return formatPace(d, last.t - points[i].t);
}

/** Corrida ao vivo em estilo escuro: ritmo grande, grelha de números, mapa e frases de incentivo. */
export function RunLive({ points, distanceM, elapsedMs, steps, kcal, paused, name, width, onTogglePause, onFinish }: Props) {
  const styles = useMemo(() => createStyles(), []);
  const [coach, setCoach] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const voiceRef = useRef(true);
  voiceRef.current = voiceOn;
  const fade = useRef(new Animated.Value(0)).current;
  const lastKm = useRef(0);
  const lastTalk = useRef(0);
  const who = name ? `, ${name}` : '';

  const say = (text: string) => {
    setCoach(text);
    if (voiceRef.current) coachSpeak(text);
    fade.setValue(0);
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.delay(5200),
      Animated.timing(fade, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    say(tr('Corrida iniciada{who}. Comece devagar e respire com calma.', { who }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const km = Math.floor(distanceM / 1000);
    if (km > lastKm.current) {
      lastKm.current = km;
      const perKm = elapsedMs / 60000 / Math.max(0.1, distanceM / 1000);
      const left = Math.max(1, Math.round(perKm));
      say(tr('{n} km percorridos. Faltam cerca de {m} minutos para o próximo quilómetro. Continue no bom ritmo{who}!', { n: km, m: left, who }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceM]);

  const halfKm = useRef(-1);
  useEffect(() => {
    const k = Math.floor(distanceM / 1000);
    if (distanceM % 1000 >= 500 && halfKm.current !== k && distanceM > 500) {
      halfKm.current = k;
      say(tr('Já passou o meio quilómetro. Falta metade para o próximo. Está a ir muito bem{who}!', { who }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceM]);

  useEffect(() => {
    const min = Math.floor(elapsedMs / 60000);
    if (min >= 3 && min % 3 === 0 && min !== lastTalk.current && !paused) {
      lastTalk.current = min;
      say(tr('Está a ir muito bem{who}. Mantenha o ritmo!', { who }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedMs]);

  const pace = recentPace(points);
  const avg = formatPace(distanceM, elapsedMs);
  const cell = (value: string, label: string) => (
    <View style={styles.cell}>
      <Text style={styles.cellValue}>{value}</Text>
      <Text style={styles.cellLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.kicker}>{paused ? tr('EM PAUSA') : tr('RITMO ATUAL')}</Text>
        <Pressable style={styles.voiceBtn} onPress={() => { if (voiceOn) coachStop(); setVoiceOn((v) => !v); }} accessibilityLabel={tr('Voz do treinador')}>
          {voiceOn ? <Volume2 size={16} color="#4ADE80" /> : <VolumeX size={16} color="#94A3B8" />}
          <Text style={[styles.voiceText, !voiceOn && { color: '#94A3B8' }]}>{voiceOn ? tr('Voz ligada') : tr('Voz desligada')}</Text>
        </Pressable>
      </View>
      <Text style={[styles.hero, paused && { color: '#94A3B8' }]}>
        {pace}
        <Text style={styles.heroUnit}> /km</Text>
      </Text>
      <View style={styles.grid}>
        {cell(formatKm(distanceM), tr('DISTÂNCIA (KM)'))}
        {cell(formatHMS(elapsedMs), tr('TEMPO'))}
        {cell(avg, tr('RITMO MÉDIO'))}
        {cell(String(kcal), tr('CALORIAS'))}
        {cell(String(steps), tr('PASSOS'))}
        {cell(String(Math.floor(distanceM / 1000) + 1), tr('KM ATUAL'))}
      </View>
      <View>
        <RouteMap points={points} width={width} height={230} dark />
        {coach && (
          <Animated.View style={[styles.bubble, { opacity: fade }]}>
            <Text style={styles.bubbleText}>“{coach}”</Text>
          </Animated.View>
        )}
      </View>
      <View style={styles.buttons}>
        <Pressable style={[styles.btn, styles.btnLight]} onPress={onTogglePause}>
          {paused ? <Play size={18} color="#0B0F14" fill="#0B0F14" /> : <Pause size={18} color="#0B0F14" fill="#0B0F14" />}
          <Text style={styles.btnLightText}>{paused ? tr('Retomar') : tr('Pausar')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnStop]} onPress={onFinish}>
          <Square size={16} color="#fff" fill="#fff" />
          <Text style={styles.btnStopText}>{tr('Terminar')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    wrap: { backgroundColor: '#0B0F14', borderRadius: 28, padding: 16, gap: 14 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    voiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    voiceText: { color: '#4ADE80', fontSize: 11, fontWeight: '700' },
    kicker: { fontSize: font.tiny, fontWeight: '700', letterSpacing: 1.2, color: '#94A3B8' },
    hero: { textAlign: 'center', fontSize: 52, lineHeight: 58, fontWeight: '800', color: '#4ADE80', letterSpacing: -1 },
    heroUnit: { fontSize: font.h2, fontWeight: '600', color: '#94A3B8' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
    cell: { width: '33.33%', alignItems: 'center', gap: 3 },
    cellValue: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
    cellLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.6, color: '#94A3B8' },
    bubble: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(30,41,59,0.95)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
    bubbleText: { color: '#F8FAFC', fontSize: font.body, fontWeight: '600' },
    buttons: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    btnLight: { backgroundColor: '#F8FAFC' },
    btnLightText: { fontSize: font.h3, fontWeight: '700', color: '#0B0F14' },
    btnStop: { backgroundColor: '#DC2626' },
    btnStopText: { fontSize: font.h3, fontWeight: '700', color: '#fff' },
  });
