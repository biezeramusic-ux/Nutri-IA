import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockOverlay } from '../../components/LockOverlay';
import { MacroSquareCard } from '../../components/MacroSquareCard';
import { colors, radius } from '../../constants/theme';
import { useDiary } from '../../hooks/useDiary';
import { useSubscription } from '../../hooks/useSubscription';
import { buildMeal, macroPercentages } from '../../services/foodCatalog';
import { recognizeFood } from '../../services/foodRecognition';
import { compressImage } from '../../services/imageCompressor';
import type { Meal } from '../../types';

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { canScan, lockReason, consumeScan } = useSubscription();
  const { setCurrent } = useDiary();
  const [busy, setBusy] = useState(false);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [fallback, setFallback] = useState(false);

  const capture = async () => {
    if (busy) return;
    if (!canScan) {
      router.push('/paywall');
      return;
    }
    setBusy(true);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (!photo) throw new Error('Sem foto');
      const small = await compressImage(photo.uri);
      // O servidor valida e conta o scan (limite diário / teste grátis) antes de gastar a IA.
      const access = await consumeScan();
      if (!access.allowed) {
        router.push('/paywall');
        return;
      }
      const { analysis, isFallback } = await recognizeFood(small.base64);
      setFallback(isFallback);
      const result = buildMeal(analysis, small.uri);
      setMeal(result);
      setCurrent(result);
    } catch {
      Alert.alert('Erro', 'Não foi possível analisar a foto. Verifique a ligação e tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center]}>
        <Ionicons name="camera-outline" size={56} color={colors.primary} />
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
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.hint}>Enquadre o prato dentro do visor</Text>
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
          <Pressable onPress={() => void capture()} style={styles.shutterOuter} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.primary} /> : <View style={styles.shutterInner} />}
          </Pressable>
          {busy && <Text style={styles.busy}>A analisar o prato…</Text>}
        </View>
      )}

      {lockReason && <LockOverlay reason={lockReason} />}
    </View>
  );
}

const CORNER = 36;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10, backgroundColor: colors.background },
  permTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  permBody: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  permButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 28, marginTop: 10 },
  permButtonText: { color: '#fff', fontWeight: '800' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  roundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#fff', fontWeight: '700', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, overflow: 'hidden' },
  finderWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  finder: { width: 270, height: 270, borderRadius: 36 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.primary, borderWidth: 5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 36 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 36 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 36 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 36 },
  shutterWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 10 },
  shutterOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary },
  busy: { color: '#fff', fontWeight: '700' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 22, gap: 12 },
  dish: { fontSize: 22, fontWeight: '800', color: colors.text },
  kcal: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  btn: { flex: 1, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: '800' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
});
