import { Droplets, Flame, Footprints, Route } from 'lucide-react-native';
import { ConnectMark } from './ConnectMark';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Text } from './AppText';
import { ProgressRing } from './ProgressRing';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { Alert } from '../i18n/alert';
import { useActivity } from '../hooks/useActivity';
import { useStepsTracking } from '../hooks/useStepsTracking';
import { useTodayWalks } from '../hooks/useTodayWalks';
import { KCAL_PER_STEP } from '../services/stepsConnection';
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
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { steps, setSteps, totals } = useActivity();
  const tracking = useStepsTracking(setSteps);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [useGps, setUseGps] = useState(true);
  const provider = Platform.OS === 'android' ? 'Google Health Connect' : Platform.OS === 'ios' ? 'Apple Saúde' : 'Nutri Saúde';
  const today = useTodayWalks();
  // Os passos das corridas já têm as suas calorias (pela distância e tempo); os outros passos contam 0,04 kcal cada.
  const otherSteps = Math.max(0, steps - today.steps);
  const stepsKcal = Math.round(otherSteps * KCAL_PER_STEP);
  const burned = totals.kcal + today.kcal + stepsKcal;
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
        <Pressable style={[styles.card, styles.stepsCard]} onPress={() => (tracking.connected ? router.push('/walk') : setConnectOpen(true))}>
          {tracking.connected ? (
            <>
              <Text style={styles.cardLabel}>{tr('Passos hoje')}</Text>
              <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <ProgressRing size={104} strokeWidth={10} progress={steps / STEPS_GOAL} color={colors.primary}>
                  <Text style={styles.ringNumber}>{steps.toLocaleString('pt-PT')}</Text>
                  <Text style={styles.ringSub}>/ {STEPS_GOAL.toLocaleString('pt-PT')}</Text>
                </ProgressRing>
              </View>
              <View style={styles.routeHint}>
                <Route size={13} color={colors.textMuted} />
                <Text style={styles.routeHintText}>{tr('Ver caminhadas')}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={{ opacity: isDark ? 0.7 : 0.35 }}>
                <Text style={styles.ghostNumber}>
                  0<Text style={styles.ghostOf}> /{STEPS_GOAL}</Text>
                </Text>
                <Text style={styles.ghostLabel}>{tr('Passos hoje')}</Text>
              </View>
              <View style={styles.connectBox}>
                <ConnectMark size={34} />
                <Text style={styles.connectText}>{tr('Conecte o {app} para rastrear os seus passos', { app: provider })}</Text>
                <View style={styles.connectPill}>
                  <Text style={styles.connect}>{tr('Conectar')}</Text>
                </View>
              </View>
            </>
          )}
        </Pressable>

        <Pressable style={[styles.card, styles.burnCard]} onPress={() => (tracking.connected ? undefined : setConnectOpen(true))} disabled={tracking.connected}>
          <View style={styles.burnIcon}>
            <Flame size={22} color={tracking.connected ? '#F97316' : colors.textFaint} />
          </View>
          <View style={{ gap: 2 }}>
            <Text style={styles.cardLabel}>{tr('Calorias queimadas')}</Text>
            {tracking.connected ? (
              <>
                <Text style={styles.burnNumber}>{burned}</Text>
                <Text style={styles.burnUnit}>kcal</Text>
              </>
            ) : (
              <>
                <Text style={[styles.burnNumber, { color: colors.textFaint }]}>--</Text>
                <Text style={styles.burnUnit}>{tr('Conecte os passos para ver')}</Text>
              </>
            )}
          </View>
          <View style={styles.burnTrack}>
            <View style={[styles.burnFill, { width: tracking.connected ? `${Math.min(100, (burned / 500) * 100)}%` : '0%' }]} />
          </View>
        </Pressable>
      </View>

      <View style={[styles.card, styles.waterRow]}>
        <View style={styles.waterIcon}>
          <Droplets size={20} color={colors.water} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sub}>{tr('Água')}</Text>
          <Text style={styles.value}>
            {drank} <Text style={styles.of}>ml</Text>
          </Text>
        </View>
        <Pressable style={styles.waterBtn} onPress={() => setOpen(true)}>
          <Text style={styles.waterBtnText}>{tr('Registrar água')}</Text>
        </Pressable>
      </View>

      <Modal visible={connectOpen} transparent animationType="slide" onRequestClose={() => setConnectOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConnectOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <View style={{ alignSelf: 'center' }}>
              <ConnectMark size={76} />
            </View>
            <Text style={styles.sheetHeadline}>{tr('Conectar o {app}', { app: provider })}</Text>
            <Text style={styles.sheetBody}>{tr('Siga os seus passos, a rota e as calorias queimadas num só sítio.')}</Text>
            {[
              { icon: Footprints, t: 'Passos do dia', d: Platform.OS === 'android' ? 'Lidos do Google Health Connect, mesmo com a app fechada.' : Platform.OS === 'ios' ? 'Lidos do Apple Saúde, incluindo o Apple Watch.' : 'Pelo sensor de movimento do telemóvel.' },
                            { icon: Flame, t: 'Calorias queimadas', d: 'Calculadas a partir dos seus passos.' },
            ].map((r) => (
              <View key={r.t} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <r.icon size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{tr(r.t)}</Text>
                  <Text style={styles.featureDesc}>{tr(r.d)}</Text>
                </View>
              </View>
            ))}
            <View style={styles.gpsRow}>
              <View style={styles.featureIcon}>
                <Route size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{tr('Mapa, rota e km (GPS)')}</Text>
                <Text style={styles.featureDesc}>{tr('Opcional. Mostra o mapa do percurso e a distância. Só é usado enquanto caminha.')}</Text>
              </View>
              <Switch value={useGps} onValueChange={setUseGps} trackColor={{ true: colors.primary, false: colors.border }} />
            </View>
            <Pressable
              style={[styles.cta, connecting && { opacity: 0.6 }]}
              disabled={connecting}
              onPress={async () => {
                setConnecting(true);
                const r = await tracking.connect(useGps);
                setConnecting(false);
                if (r.status === 'ok') setConnectOpen(false);
                else {
                  const msg =
                    r.status === 'denied'
                      ? tr('Permita o acesso à atividade física nas definições do telemóvel.')
                      : r.status === 'not_installed'
                        ? tr('Instale ou atualize o Google Health Connect na Play Store e tente outra vez.')
                        : tr('Este telemóvel não tem sensor de passos ou está a usar o navegador.');
                  const needsSettings = r.status === 'denied';
                  Alert.alert(
                    r.status === 'denied' ? tr('Permissão necessária') : tr('Não disponível'),
                    msg,
                    needsSettings
                      ? [
                          { text: tr('Cancelar'), style: 'cancel' },
                          { text: tr('Abrir definições'), onPress: () => void Linking.openSettings() },
                        ]
                      : undefined,
                  );
                }
              }}
            >
              <Text style={styles.ctaText}>{tr('Conectar')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
    stepsCard: { flex: 1.1, height: 222, justifyContent: 'space-between' },
    burnCard: { flex: 1, height: 222, justifyContent: 'space-between', backgroundColor: colors.limeSoft, borderColor: 'transparent' },
    burnNumber: { fontSize: 38, fontWeight: '800', color: colors.text, letterSpacing: -1, lineHeight: 42 },
    burnUnit: { fontSize: font.small, color: colors.textMuted },

    ghostNumber: { fontSize: 26, fontWeight: '800', color: colors.text },
    ghostOf: { fontSize: font.small, fontWeight: '500', color: colors.textMuted },
    ghostLabel: { fontSize: font.small, color: colors.textMuted },
    connectBox: { backgroundColor: colors.card, borderRadius: 16, padding: 10, gap: 8, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    connectText: { fontSize: font.small, fontWeight: '700', color: colors.text, lineHeight: 17 },
    ringNumber: { fontSize: 20, fontWeight: '800', color: colors.text },
    ringSub: { fontSize: font.tiny, color: colors.textMuted },
    routeHint: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
    routeHintText: { fontSize: font.tiny, color: colors.textMuted },
    waterBtn: { borderWidth: 1.5, borderColor: colors.text, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 10 },
    waterBtnText: { fontSize: font.body, fontWeight: '700', color: colors.text },
    bigMark: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#2E9E4F', alignItems: 'center', justifyContent: 'center' },
    sheetHeadline: { fontSize: font.h2, fontWeight: '800', color: colors.text, textAlign: 'center' },
    sheetBody: { fontSize: font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
    gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    featureTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
    featureDesc: { fontSize: font.small, color: colors.textMuted },
    burnIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
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
