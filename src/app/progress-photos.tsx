import * as ImagePicker from 'expo-image-picker';
import { Camera, Trash } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { Text } from '../components/AppText';
import { Alert } from '../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProGate } from '../components/ProOverlay';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { deleteProgressPhoto, listProgressPhotos, saveProgressPhoto, type ProgressPhoto } from '../services/progressPhotos';
import { tr } from '../i18n';

const fmtDate = (t: number) => new Date(t).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ProgressPhotosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<ProgressPhoto[]>(() => listProgressPhotos());

  const take = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(tr('Câmera desligada'), tr('Permita o acesso à câmera nas definições do telemóvel.'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false });
    if (res.canceled) return;
    const saved = saveProgressPhoto(res.assets[0].uri);
    if (!saved) {
      Alert.alert(tr('Não foi possível guardar'), tr('Tente novamente.'));
      return;
    }
    setPhotos(listProgressPhotos());
  };

  const confirmDelete = (p: ProgressPhoto) =>
    Alert.alert(tr('Apagar foto'), tr('Esta foto fica apagada do telemóvel.'), [
      { text: tr('Cancelar'), style: 'cancel' },
      {
        text: tr('Apagar'),
        style: 'destructive',
        onPress: () => {
          deleteProgressPhoto(p.name);
          setPhotos(listProgressPhotos());
        },
      },
    ]);

  return (
    <ProGate feature={tr('Tire fotos de progresso e compare o antes e o depois.')}>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title={tr('Fotos de progresso')} />
          <Text style={styles.sub}>{tr('As fotos ficam só no seu telemóvel e não são enviadas para a nuvem.')}</Text>
          <Pressable style={styles.cta} onPress={() => void take()}>
            <Camera size={18} color="#fff" />
            <Text style={styles.ctaText}>{tr('Tirar foto de hoje')}</Text>
          </Pressable>
          <View style={styles.grid}>
            {photos.map((p) => (
              <View key={p.name} style={styles.item}>
                <Image source={{ uri: p.uri }} style={styles.img} />
                <View style={styles.meta}>
                  <Text style={styles.date}>{fmtDate(p.takenAt)}</Text>
                  <Pressable onPress={() => confirmDelete(p)} hitSlop={8} accessibilityLabel={tr('Apagar foto')}>
                    <Trash size={14} color={colors.textFaint} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
          {photos.length === 0 && <Text style={styles.sub}>{tr('Ainda não tem fotos. Tire a primeira para começar a comparar.')}</Text>}
        </ScrollView>
      </View>
    </ProGate>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    sub: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
    cta: { flexDirection: 'row', gap: 8, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: font.body },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    item: { width: '48%', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    img: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.surface },
    meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 },
    date: { fontSize: font.tiny, color: colors.textMuted },
  });
