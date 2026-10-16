import { Droplets, Flame, Footprints, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from './AppText';
import { ProgressRing } from './ProgressRing';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useActivity } from '../hooks/useActivity';
import { useTheme } from '../hooks/useTheme';
import { useWater } from '../hooks/useWater';
import { STEPS_GOAL } from '../services/activity';
import { GLASS_ML } from '../services/goals';
import { tr } from '../i18n';

const QUICK = [
  { label: '+1 Copo', ml: 250 },
  { label: '+1 Garrafa', ml: 500 },
  { label: '+1 Garrafa grande', ml: 750 },
];

/** Passos + calorias queimadas e, por baixo, o registo rápido de água. */
export function StepsWaterCards() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { steps, totals } = useActivity();
  const water = useWater();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const ml = Number(text.replace(/\D/g, '')) || 0;
  const drank = water.drankMl;
  const close = () => {
    setOpen(false);
    setText('');
  };
  const register = () => {
    if (ml <= 0) return;
    water.addGlasses(Math.max(1, Math.round(ml / GLASS_ML)));
    close();
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        <View style={[styles.card, styles.stepsCard]}>
          <ProgressRing size={64} strokeWidth={7} progress={steps / STEPS_GOAL} color={colors.primary}>
            <Footprints size={20} color={colors.primary} />
          </ProgressRing>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={styles.cardLabel}>{tr('Passos hoje')}</Text>
            <Text style={styles.value}>{steps.toLocaleString('pt-PT')}</Text>
            <Text style={styles.sub}>
              / {STEPS_GOAL.toLocaleString('pt-PT')}
            </Text>
            <Pressable onPress={() => router.push('/walk')} hitSlop={6} style={styles.connectPill}>
              <Text style={styles.connect}>{tr('Conectar')}</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.card, styles.burnCard]}>
          <View style={styles.burnIcon}>
            <Flame size={20} color="#F97316" />
          </View>
          <Text style={styles.cardLabel}>{tr('Calorias queimadas')}</Text>
          <Text style={styles.value}>
            {totals.kcal}
            <Text style={styles.of}> kcal</Text>
          </Text>
          <View style={styles.burnTrack}>
            <View style={[styles.burnFill, { width: `${Math.min(100, (totals.kcal / 500) * 100)}%` }]} />
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.waterRow]}>
        <View style={styles.waterIcon}>
          <Droplets size={18} color={colors.water} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.value}>
            {drank} <Text style={styles.of}>ml</Text>
          </Text>
          <Text style={styles.sub}>{tr('Registrar água')}</Text>
        </View>
        <Pressable style={styles.plus} onPress={() => setOpen(true)} accessibilityLabel={tr('Registrar água')}>
          <Plus size={18} color={colors.background} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{tr('Registrar água')}</Text>
            <View style={styles.amountRow}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                autoFocus
                style={styles.amount}
              />
              <Text style={styles.unit}>mL</Text>
            </View>
            <View style={styles.quickRow}>
              {QUICK.map((q) => (
                <Pressable key={q.ml} style={styles.quick} onPress={() => setText(String(ml + q.ml))}>
                  <Droplets size={16} color={colors.water} />
                  <Text style={styles.quickLabel}>{tr(q.label)}</Text>
                  <Text style={styles.quickMl}>{q.ml} mL</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.cta, ml <= 0 && { opacity: 0.35 }]} disabled={ml <= 0} onPress={register}>
              <Text style={styles.ctaText}>{tr('Registro')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    stepsCard: { flex: 1.45, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primarySoft, borderColor: 'transparent' },
    burnCard: { flex: 1, gap: 4, backgroundColor: colors.limeSoft, borderColor: 'transparent' },
    burnIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    burnTrack: { height: 6, borderRadius: 3, backgroundColor: colors.card, overflow: 'hidden', marginTop: 4 },
    burnFill: { height: 6, borderRadius: 3, backgroundColor: '#F97316' },
    cardLabel: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
    connectPill: { alignSelf: 'flex-start', backgroundColor: colors.text, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
    card: { ...cardBase(colors), padding: 14, gap: 6 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: font.body, fontWeight: '600', color: colors.text },
    value: { fontSize: 22, fontWeight: '700', color: colors.text },
    of: { fontSize: font.small, color: colors.textMuted, fontWeight: '500' },
    sub: { fontSize: font.tiny, color: colors.textMuted },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3, backgroundColor: colors.text },
    connect: { fontSize: 11, fontWeight: '700', color: colors.background },
    waterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    waterIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.waterSoft, alignItems: 'center', justifyContent: 'center' },
    plus: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 24, gap: 16 },
    grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
    sheetTitle: { alignSelf: 'center', fontSize: font.h3, fontWeight: '600', color: colors.text },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 },
    amount: { fontSize: 56, fontWeight: '700', color: colors.text, minWidth: 60, textAlign: 'center', padding: 0 },
    unit: { fontSize: font.h3, fontWeight: '600', color: colors.text },
    quickRow: { flexDirection: 'row', gap: 8 },
    quick: { flex: 1, ...cardBase(colors), padding: 10, gap: 4 },
    quickLabel: { fontSize: font.small, fontWeight: '600', color: colors.text },
    quickMl: { fontSize: font.tiny, color: colors.textMuted },
    cta: { height: 54, borderRadius: radius.pill, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: font.h3, fontWeight: '600', color: colors.background },
  });
