import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Keyboard, ScanBarcode, ScanLine, Search, X, Zap, ZapOff } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockOverlay } from '../../components/LockOverlay';
import { ScanResultSheet } from '../../components/ScanResultSheet';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useDiary } from '../../hooks/useDiary';
import { useSubscription } from '../../hooks/useSubscription';
import { buildMeal } from '../../services/foodCatalog';
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
  const [torch, setTorch] = useState(false);
  // Foto tirada: fica no ecrã com a animação de análise enquanto a IA trabalha.
  const [shot, setShot] = useState<string | null>(null);
  const sweep = useRef(new Animated.Value(0)).current;
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
      setShot(null);
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
      setShot(null);
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
    setShot(null);
    lastCode.current = '';
    setMeal(null);
  };

  const modeBar = (
    <View style={styles.modeBar}>
      {([
        ['barcode', ScanBarcode, tr('Código de barras')],
        ['photo', ScanLine, tr('Scan IA')],
        ['text', Keyboard, tr('Descrever')],
      ] as const).map(([key, Icon, label]) => (
        <Pressable key={key} onPress={() => changeMode(key)} style={[styles.modeBtn, mode === key && styles.modeBtnOn]}>
          <Icon size={15} color="#fff" />
          <Text style={styles.modeText}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const capture = () =>
    run(async () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (!photo) throw new Error('Sem foto');
      setShot(photo.uri);
      return photo.uri;
    });

  const scanning = busy && !!shot;
  useEffect(() => {
    if (!scanning) {
      sweep.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanning, sweep]);

  const hintText =
    mode === 'barcode'
      ? tr('Aponte para o código de barras')
      : mode === 'text'
        ? tr('Descreva o que comeu')
        : !isPro && scansLeftToday != null
          ? tr('{n} análises restantes hoje', { n: scansLeftToday })
          : tr('Enquadre o prato dentro do visor');

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
          enableTorch={torch}
          onBarcodeScanned={mode === 'barcode' ? (r) => void onBarcode(r) : undefined}
        />
      )}

      {shot && mode === 'photo' && (
        <>
          <Image source={{ uri: shot }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {scanning && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.28)' }]} />}
        </>
      )}

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Pressable style={[styles.roundBtn, mode === 'text' && { backgroundColor: colors.surface }]} onPress={() => router.navigate('/')}>
          <X size={20} color={mode === 'text' ? colors.text : '#fff'} />
        </Pressable>
        <Text style={[styles.screenTitle, mode === 'text' && { color: colors.text }]}>{tr('Adicionar alimento')}</Text>
        {mode === 'text' ? (
          <View style={styles.roundBtn} />
        ) : (
          <Pressable style={styles.searchPill} onPress={() => changeMode('text')}>
            <Search size={14} color="#fff" />
            <Text style={styles.searchText}>{tr('Pesquisar')}</Text>
          </Pressable>
        )}
      </View>

      {mode !== 'text' && (
      <View style={styles.finderWrap} pointerEvents="none">
        <View style={[styles.finder, mode === 'barcode' && { width: 300, height: 170 }]}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          {scanning && (
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [8, 270] }) }] },
              ]}
            />
          )}
        </View>
      </View>
      )}

      {meal ? (
        <ScanResultSheet
          meal={meal}
          fallback={fallback}
          bottomInset={insets.bottom}
          onNew={() => {
            setMeal(null);
            setShot(null);
          }}
          onDetails={() => router.push({ pathname: '/details', params: { id: meal.id } })}
        />
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
        <View style={[styles.shutterWrap, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.hintPill}>
            <Text style={styles.hintText}>{busy ? (mode === 'barcode' ? tr('A procurar o produto…') : tr('A analisar o prato…')) : hintText}</Text>
          </View>
          {!scanning && (
          <View style={styles.controls}>
            <View style={styles.sideBtn} />
            {mode === 'photo' ? (
              <Pressable onPress={() => void capture()} style={styles.shutterOuter} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <View style={styles.shutterInner} />}
              </Pressable>
            ) : (
              <View style={styles.shutterOuter}>{busy && <ActivityIndicator color="#fff" />}</View>
            )}
            <Pressable style={[styles.sideBtn, torch && { backgroundColor: '#fff' }]} onPress={() => setTorch((t) => !t)} accessibilityLabel={tr('Lanterna')}>
              {torch ? <Zap size={20} color="#0F172A" /> : <ZapOff size={20} color="#fff" />}
            </Pressable>
          </View>
          )}
          {!scanning && modeBar}
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
  finder: { width: 280, height: 280, borderRadius: 28 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff', borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 28 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 28 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 28 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 28 },
  shutterWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 8 },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 36 },
  sideBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  scanLine: { position: 'absolute', left: 4, right: 4, height: 3, borderRadius: 2, backgroundColor: '#fff', shadowColor: '#fff', shadowOpacity: 0.95, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  hintPill: { backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  hintText: { color: '#fff', fontWeight: '500', fontSize: font.small },
  screenTitle: { color: '#fff', fontSize: font.h3, fontWeight: '700' },
  searchPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill, paddingHorizontal: 12, height: 36 },
  searchText: { color: '#fff', fontSize: font.small, fontWeight: '600' },
  modeBar: { flexDirection: 'row', alignSelf: 'center', gap: 4, backgroundColor: 'rgba(20,20,20,0.78)', padding: 5, borderRadius: radius.pill, marginTop: 4 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 9, borderRadius: radius.pill },
  modeBtnOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
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
