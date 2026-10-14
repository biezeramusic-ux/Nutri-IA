import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Keyboard, ScanBarcode, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockOverlay } from '../../components/LockOverlay';
import { MacroSquareCard } from '../../components/MacroSquareCard';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useDiary } from '../../hooks/useDiary';
import { useSubscription } from '../../hooks/useSubscription';
import { buildMeal, macroPercentages } from '../../services/foodCatalog';
import { describeFood, recognizeFood } from '../../services/foodRecognition';
import { lookupBarcode } from '../../services/barcode';
import { compressImage } from '../../services/imageCompressor';
import { scheduleMealWaterNudge } from '../../services/notifications';
import { MEAL_TYPES, getMealType } from '../../services/dayUtils';
import type { Meal, MealType } from '../../types';
import { tr } from '../../i18n';

type Mode = 'photo' | 'barcode' | 'text';

export default function ScannerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { canScan, lockReason, refresh, scansLeftToday, isPro } = useSubscription();
  const { setCurrent } = useDiary();
  const [busy, setBusy] = useState(false);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [fallback, setFallback] = useState(false);
  const [mode, setMode] = useState<Mode>('photo');
  const [description, setDescription] = useState('');
  const lastCode = useRef('');
  // A refeição vem do botão "+" do diário (ex.: Lanche); senão deduz-se pela hora.
  const { meal: mealParam } = useLocalSearchParams<{ meal?: string }>();
  const [mealType, setMealType] = useState<MealType>(() => getMealType(Date.now()));
  // Refeição vinda do botão "+" (uma só vez) e, ao sair do scanner, volta à da hora atual.
  useEffect(() => {
    const wanted = MEAL_TYPES.find((t) => t.type === mealParam)?.type;
    if (wanted) {
      setMealType(wanted);
      router.setParams({ meal: undefined });
    }
  }, [mealParam, router]);
  useFocusEffect(useCallback(() => () => setMealType(getMealType(Date.now())), []));

  const analyze = async (uri: string) => {
    const small = await compressImage(uri);
    // O servidor valida e conta o scan (limite diário / teste grátis) antes de gastar a IA.
    const { allowed, analysis, isFallback } = await recognizeFood(small.base64);
    void refresh();
    if (!allowed) {
      router.push('/paywall');
      return;
    }
    setFallback(isFallback);
    // A foto mostrada na app é a original; a IA recebeu só a versão pequena.
    const result = { ...buildMeal(analysis, uri), mealType };
    setMeal(result);
    setCurrent(result);
    void scheduleMealWaterNudge();
  };

  const run = async (getUri: () => Promise<string | null>) => {
    if (busy) return;
    if (!canScan) {
      router.push('/paywall');
      return;
    }
    setBusy(true);
    try {
      const uri = await getUri();
      if (uri) await analyze(uri);
    } catch {
      Alert.alert(tr('Erro'), tr('Não foi possível analisar a foto. Verifique a ligação e tente novamente.'));
    } finally {
      setBusy(false);
    }
  };

  const showResult = (analysis: Meal['analysis'], isFallback = false) => {
    setFallback(isFallback);
    const result = { ...buildMeal(analysis), mealType };
    setMeal(result);
    setCurrent(result);
    void scheduleMealWaterNudge();
  };

  const submitDescription = async () => {
    const text = description.trim();
    if (!text || busy) return;
    if (!canScan) {
      router.push('/paywall');
      return;
    }
    setBusy(true);
    try {
      const out = await describeFood(text);
      void refresh();
      if (out.status === 'blocked') router.push('/paywall');
      else if (out.status === 'not_food') Alert.alert(tr('Não percebi o prato'), tr('Escreva o que comeu, por exemplo: "xima com peixe e matapa".'));
      else {
        showResult(out.analysis, out.isFallback);
        setDescription('');
      }
    } finally {
      setBusy(false);
    }
  };

  const onBarcode = async ({ data }: { data: string }) => {
    if (busy || meal || data === lastCode.current) return;
    lastCode.current = data;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBusy(true);
    try {
      const out = await lookupBarcode(data);
      if (out.status === 'ok') showResult(out.analysis);
      else {
        Alert.alert(
          out.status === 'offline' ? tr('Sem ligação') : tr('Produto não encontrado'),
          out.status === 'offline'
            ? tr('Verifique a ligação à internet e tente novamente.')
            : tr('Este código ainda não está na base de dados. Tire uma foto ao prato ou descreva-o.'),
        );
        setTimeout(() => (lastCode.current = ''), 2500);
      }
    } finally {
      setBusy(false);
    }
  };

  const changeMode = (m: Mode) => {
    setMode(m);
    lastCode.current = '';
    setMeal(null);
  };

  const modeBar = (
    <View style={styles.modeBar}>
      {([
        ['photo', Camera, tr('Foto')],
        ['barcode', ScanBarcode, tr('Código de barras')],
        ['text', Keyboard, tr('Descrever')],
      ] as const).map(([key, Icon, label]) => (
        <Pressable key={key} onPress={() => changeMode(key)} style={[styles.modeBtn, mode === key && styles.modeBtnOn]}>
          <Icon size={15} color={mode === key ? '#0F172A' : '#fff'} />
          <Text style={[styles.modeText, mode === key && { color: '#0F172A' }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const capture = () =>
    run(async () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (!photo) throw new Error('Sem foto');
      return photo.uri;
    });

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted && mode !== 'text') {
    return (
      <View style={[styles.root, styles.center]}>
        <Camera size={44} color={colors.primary} strokeWidth={1.5} />
        <Text style={styles.permTitle}>{tr('Precisamos da sua câmera')}</Text>
        <Text style={styles.permBody}>{tr('Para reconhecer a sua refeição e calcular as calorias.')}</Text>
        <Pressable style={styles.permButton} onPress={() => void requestPermission()}>
          <Text style={styles.permButtonText}>{tr('Permitir câmera')}</Text>
        </Pressable>
        <Pressable onPress={() => setMode('text')} style={{ marginTop: 6 }}>
          <Text style={[styles.permBody, { color: colors.primary, fontWeight: '600' }]}>{tr('Ou descreva o prato')}</Text>
        </Pressable>
      </View>
    );
  }

  const macros = meal ? macroPercentages(meal.analysis) : null;

  return (
    <View style={styles.root}>
      {mode === 'text' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      ) : (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
          onBarcodeScanned={mode === 'barcode' ? (r) => void onBarcode(r) : undefined}
        />
      )}

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Pressable style={[styles.roundBtn, mode === 'text' && { backgroundColor: colors.surface }]} onPress={() => router.navigate('/')}>
          <X size={20} color={mode === 'text' ? colors.text : '#fff'} />
        </Pressable>
        <Text style={styles.hint}>
          {mode === 'barcode'
            ? tr('Aponte para o código de barras')
            : mode === 'text'
              ? tr('Descreva o que comeu')
              : !isPro && scansLeftToday != null
                ? tr('{n} análises restantes hoje', { n: scansLeftToday })
                : 'Enquadre o prato dentro do visor'}
        </Text>
        <View style={styles.roundBtn} />
      </View>

      {mode !== 'text' && (
      <View style={styles.finderWrap} pointerEvents="none">
        <View style={[styles.finder, mode === 'barcode' && { width: 280, height: 150 }]}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>
      )}

      {meal && macros ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.dish}>
            {meal.analysis.food_name} - {meal.analysis.estimated_weight_grams}g
          </Text>
          <Text style={styles.kcal}>
            {meal.analysis.calories} kcal{fallback ? ` · ${tr('exemplo (sem ligação à IA)')}` : ''}
          </Text>
          <View style={styles.macroRow}>
            <MacroSquareCard label={tr('Carboidratos')} percent={macros.carbs} grams={meal.analysis.carbs_g} color={colors.carbs} />
            <MacroSquareCard label={tr('Proteínas')} percent={macros.protein} grams={meal.analysis.protein_g} color={colors.protein} />
            <MacroSquareCard label={tr('Gorduras')} percent={macros.fats} grams={meal.analysis.fats_g} color={colors.fats} />
          </View>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setMeal(null)}>
              <Text style={styles.btnGhostText}>{tr('Novo scan')}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => {
                router.push({ pathname: '/details', params: { id: meal.id } });
              }}
            >
              <Text style={styles.btnPrimaryText}>{tr('Ver detalhes')}</Text>
            </Pressable>
          </View>
        </View>
      ) : mode === 'text' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.textWrap}>
          <View style={styles.textCard}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={tr('Ex.: comi xima com peixe grelhado e matapa')}
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
              style={styles.textInput}
            />
            <Text style={styles.textHint}>{tr('Dica: toque no microfone do teclado para falar.')}</Text>
            <Pressable style={[styles.btn, styles.btnPrimary, (!description.trim() || busy) && { opacity: 0.4 }]} disabled={!description.trim() || busy} onPress={() => void submitDescription()}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{tr('Analisar')}</Text>}
            </Pressable>
          </View>
          {modeBar}
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.shutterWrap, { paddingBottom: insets.bottom + 24 }]}>
          {mode === 'photo' ? (
            <Pressable onPress={() => void capture()} style={styles.shutterOuter} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.primary} /> : <View style={styles.shutterInner} />}
            </Pressable>
          ) : (
            busy && <ActivityIndicator color="#fff" />
          )}
          {busy && <Text style={styles.busy}>{mode === 'barcode' ? tr('A procurar o produto…') : tr('A analisar o prato…')}</Text>}
          {modeBar}
        </View>
      )}

      {lockReason && <LockOverlay reason={lockReason} />}
    </View>
  );
}

const CORNER = 30;
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10, backgroundColor: colors.background },
  permTitle: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  permBody: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
  permButton: { backgroundColor: colors.primary, borderRadius: radius.md, height: 46, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  permButtonText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  roundBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#fff', fontWeight: '500', fontSize: font.small, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, overflow: 'hidden' },
  finderWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  finder: { width: 240, height: 240, borderRadius: 28 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.primary, borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 28 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 28 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 28 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 28 },
  shutterWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 8 },
  shutterOuter: { width: 68, height: 68, borderRadius: 34, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary },
  modeBar: { flexDirection: 'row', alignSelf: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: radius.pill, marginTop: 6 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  modeBtnOn: { backgroundColor: '#fff' },
  modeText: { color: '#fff', fontSize: font.small, fontWeight: '600' },
  textWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 90, justifyContent: 'flex-end', paddingBottom: 24, gap: 8 },
  textCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  textInput: { minHeight: 90, maxHeight: 160, fontSize: font.h3, color: colors.text, textAlignVertical: 'top' },
  textHint: { fontSize: font.small, color: colors.textMuted },
  busy: { color: '#fff', fontWeight: '500', fontSize: font.body },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10 },
  dish: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  kcal: { fontSize: font.body, color: colors.textMuted },
  macroRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: '600', fontSize: font.body },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: font.body },
});
