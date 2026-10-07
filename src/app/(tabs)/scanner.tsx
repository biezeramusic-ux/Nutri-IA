import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockOverlay } from '../../components/LockOverlay';
import { MacroSquareCard } from '../../components/MacroSquareCard';
import { colors, font, radius } from '../../constants/theme';
import { useDiary } from '../../hooks/useDiary';
import { useSubscription } from '../../hooks/useSubscription';
import { buildMeal, macroPercentages } from '../../services/foodCatalog';
import { recognizeFood } from '../../services/foodRecognition';
import { compressImage } from '../../services/imageCompressor';
import { scheduleMealWaterNudge } from '../../services/notifications';
import type { Meal } from '../../types';

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { canScan, lockReason, refresh, scansLeftToday, isPro } = useSubscription();
  const { setCurrent } = useDiary();
  const [busy, setBusy] = useState(false);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [fallback, setFallback] = useState(false);

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
    const result = buildMeal(analysis, uri);
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
      Alert.alert('Erro', 'Não foi possível analisar a foto. Verifique a ligação e tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const capture = () =>
    run(async () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (!photo) throw new Error('Sem foto');
      return photo.uri;
    });

  const pickFromGallery = () =>
    run(async () => {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      return res.canceled ? null : res.assets[0].uri;
    });

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center]}>
        <Camera size={44} color={colors.primary} strokeWidth={1.5} />
        <Text style={styles.permTitle}>Precisamos da sua câmera</Text>
        <Text style={styles.permBody}>Para reconhecer a sua refeição e calcular as calorias.</Text>
        <Pressable style={styles.permButton} onPress={() => void requestPermission()}>
          <Text style={styles.permButtonText}>Permitir câmera</Text>
        </Pressable>
      </View>
    );
  }

  const macros = meal ? macroPercentages(meal.analysis) : null;

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.roundBtn} onPress={() => router.navigate('/')}>
          <X size={20} color="#fff" />
        </Pressable>
        <Text style={styles.hint}>
          {!isPro && scansLeftToday != null ? `${scansLeftToday} análises restantes hoje` : 'Enquadre o prato dentro do visor'}
        </Text>
        <View style={styles.roundBtn} />
      </View>

      <View style={styles.finderWrap} pointerEvents="none">
        <View style={styles.finder}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>

      {meal && macros ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.dish}>
            {meal.analysis.food_name} - {meal.analysis.estimated_weight_grams}g
          </Text>
          <Text style={styles.kcal}>
            {meal.analysis.calories} kcal{fallback ? ' · exemplo (sem ligação à IA)' : ''}
          </Text>
          <View style={styles.macroRow}>
            <MacroSquareCard label="Carboidratos" percent={macros.carbs} grams={meal.analysis.carbs_g} color={colors.carbs} />
            <MacroSquareCard label="Proteínas" percent={macros.protein} grams={meal.analysis.protein_g} color={colors.protein} />
            <MacroSquareCard label="Gorduras" percent={macros.fats} grams={meal.analysis.fats_g} color={colors.fats} />
          </View>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setMeal(null)}>
              <Text style={styles.btnGhostText}>Novo scan</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => {
                router.push({ pathname: '/details', params: { id: meal.id } });
              }}
            >
              <Text style={styles.btnPrimaryText}>Ver detalhes</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.shutterWrap, { paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.shutterRow}>
            <Pressable style={styles.roundBtn} onPress={() => void pickFromGallery()} disabled={busy}>
              <ImageIcon size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={() => void capture()} style={styles.shutterOuter} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.primary} /> : <View style={styles.shutterInner} />}
            </Pressable>
            <View style={styles.roundBtn} />
          </View>
          {busy && <Text style={styles.busy}>A analisar o prato…</Text>}
        </View>
      )}

      {lockReason && <LockOverlay reason={lockReason} />}
    </View>
  );
}

const CORNER = 30;
const styles = StyleSheet.create({
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
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 240 },
  shutterOuter: { width: 68, height: 68, borderRadius: 34, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary },
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
