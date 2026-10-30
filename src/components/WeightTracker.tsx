import { Plus, Scale } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { WeightChart } from './WeightChart';
import { ValueStepper as NumberStepper } from './ValueStepper';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { Alert } from '../i18n/alert';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { useWeightLogs } from '../hooks/useWeightLogs';
import { todayKey } from '../services/date';
import { tr } from '../i18n';

const RANGES: { id: string; label: string; days: number | null }[] = [
  { id: 'week', label: 'Semana', days: 7 },
  { id: 'month', label: 'Mês', days: 30 },
  { id: 'year', label: 'Ano', days: 365 },
  { id: 'all', label: 'Todo o tempo', days: null },
];

const kg = (n: number) => n.toFixed(1).replace('.', ',');
const dd = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const longDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Rastreador de peso: peso atual e alvo (do quiz), progresso até à meta (perder ou ganhar massa),
 * gráfico por período com a linha da meta e a lista de registos.
 */
export function WeightTracker({ width: totalWidth }: { width: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useProfile();
  const { logs, addToday } = useWeightLogs(1200);
  const [range, setRange] = useState('month');
  const [draft, setDraft] = useState<number | null>(null);

  const goal = profile?.goal;
  const quizWeight = profile?.quiz?.weightKg;
  const wantsTarget = goal === 'lose_weight' || goal === 'gain_muscle';
  const target = wantsTarget ? profile?.quiz?.targetWeightKg : undefined;
  const latest = logs[logs.length - 1];
  const current = latest?.weightKg ?? quizWeight;
  const start = logs[0]?.weightKg ?? quizWeight;

  const days = RANGES.find((r) => r.id === range)?.days ?? null;
  const since = useMemo(() => {
    if (days === null) return '';
    const d = new Date();
    d.setDate(d.getDate() - days);
    return todayKey(d);
  }, [days]);
  const inRange = logs.filter((l) => l.day >= since);
  const chartW = totalWidth - 32;

  const change = current !== undefined && start !== undefined ? Math.round((current - start) * 10) / 10 : null;
  const gaining = goal === 'gain_muscle';
  const pct =
    wantsTarget && start !== undefined && current !== undefined && target !== undefined && start !== target
      ? Math.max(0, Math.min(1, (current - start) / (target - start)))
      : null;
  const left = current !== undefined && target !== undefined ? Math.abs(current - target) : null;
  const progressTitle = gaining ? tr('Massa ganha') : goal === 'lose_weight' ? tr('Peso perdido') : tr('Variação de peso');
  const progressValue = change === null ? '--' : `${gaining ? (change >= 0 ? '+' : '−') : change <= 0 ? '−' : '+'}${kg(Math.abs(change))} kg`;

  const rows = [...logs].reverse();

  const save = async () => {
    if (draft === null) return;
    try {
      await addToday(draft);
      setDraft(null);
    } catch {
      Alert.alert(tr('Não foi possível guardar'), tr('Verifique a ligação à internet.'));
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>{tr('Rastreador de peso')}</Text>
        <Pressable style={styles.plus} onPress={() => setDraft(Math.round((current ?? 65) * 2) / 2)} accessibilityLabel={tr('Registar peso')}>
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>

        <View style={styles.pair}>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>{tr('Peso atual')}</Text>
            <Text style={styles.boxValue}>{current !== undefined ? `${kg(current)} kg` : '--'}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>{tr('Peso alvo')}</Text>
            <Text style={styles.boxValue}>{target !== undefined ? `${kg(target)} kg` : '--'}</Text>
          </View>
        </View>

        {draft !== null && (
          <View style={[styles.card, { gap: 10 }]}>
            <NumberStepper label={tr('O seu peso hoje')} value={draft} unit="kg" min={30} max={300} step={0.5} onChange={setDraft} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={[styles.btn, { backgroundColor: colors.surface }]} onPress={() => setDraft(null)}>
                <Text style={[styles.btnText, { color: colors.text }]}>{tr('Cancelar')}</Text>
              </Pressable>
              <Pressable style={[styles.btn, { backgroundColor: colors.primary, flex: 1.4 }]} onPress={() => void save()}>
                <Text style={styles.btnText}>{tr('Guardar')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.progressHead}>
            <View style={styles.iconBubble}>
              <Scale size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>{progressTitle}</Text>
              <Text style={styles.big}>{progressValue}</Text>
            </View>
            {pct !== null && <Text style={styles.pct}>{Math.round(pct * 100)}%</Text>}
          </View>
          {pct !== null && (
            <>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(3, pct * 100)}%` }]} />
              </View>
              <Text style={styles.small}>
                {left !== null && left < 0.1
                  ? tr('Meta alcançada! Parabéns.')
                  : tr('Faltam {kg} kg para os {target} kg.', { kg: kg(left ?? 0), target: kg(target ?? 0) })}
              </Text>
            </>
          )}
          {gaining && <Text style={styles.small}>{tr('O ganho de peso inclui músculo. Combine com treino de força e proteína suficiente.')}</Text>}
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {RANGES.map((r) => (
              <Pressable key={r.id} style={[styles.tab, range === r.id && styles.tabOn]} onPress={() => setRange(r.id)}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.tabText, range === r.id && { color: '#fff' }]}>{tr(r.label)}</Text>
              </Pressable>
            ))}
          </View>
          {inRange.length > 0 ? (
            <WeightChart points={inRange.map((l) => ({ label: dd(l.day), value: l.weightKg }))} width={chartW} height={220} goal={target} goalLabel={tr('Meta')} />
          ) : (
            <Text style={styles.small}>{logs.length === 0 ? tr('Ainda não registou o peso. Toque em + para começar.') : tr('Sem registos de peso neste período.')}</Text>
          )}
        </View>

        {rows.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.title}>{tr('Entradas de peso')}</Text>
            {rows.map((l, i) => {
              const prev = rows[i + 1];
              const d = prev ? Math.round((l.weightKg - prev.weightKg) * 10) / 10 : 0;
              const good = gaining ? d > 0 : d < 0;
              return (
                <View key={l.day} style={styles.entry}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryKg}>{kg(l.weightKg)} kg</Text>
                    <Text style={styles.small}>{longDay(l.day)}</Text>
                  </View>
                  {!!prev && d !== 0 && (
                    <Text style={[styles.delta, { color: good ? colors.primaryDark : colors.danger }]}>
                      {d > 0 ? '+' : '−'}
                      {kg(Math.abs(d))}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: font.h2, fontWeight: '800', color: colors.text },
    plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    pair: { flexDirection: 'row', gap: 12 },
    box: { flex: 1, ...cardBase(colors), borderRadius: radius.lg, padding: 14, gap: 4 },
    boxLabel: { fontSize: font.small, color: colors.textMuted, fontWeight: '600' },
    boxValue: { fontSize: font.h1, fontWeight: '800', color: colors.text },
    card: { ...cardBase(colors), borderRadius: radius.card, padding: 16, gap: 10 },
    progressHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    small: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
    big: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    pct: { fontSize: font.h2, fontWeight: '800', color: colors.primaryDark },
    track: { height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
    tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 3 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2, borderRadius: radius.md - 2 },
    tabOn: { backgroundColor: colors.primary },
    tabText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
    title: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    entry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
    entryKg: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    delta: { fontSize: font.body, fontWeight: '800' },
    btn: { height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', flex: 1 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: font.body },
  });
