import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { Text } from './AppText';
import { font, radius } from '../constants/theme';
import { tr } from '../i18n';
import { formatKm, formatPace, type RoutePoint } from '../services/walks';

const clockMs = (ms: number) => {
  const t = Math.round(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};

/** Cartão da corrida estilo Strava: a sua foto por trás, o percurso desenhado por cima e os números grandes. */
export function RunShareCard({ points, distanceM, ms, title, width }: { points: RoutePoint[]; distanceM: number; ms: number; title: string; width: number }) {
  const styles = useMemo(() => createStyles(), []);
  const [photo, setPhoto] = useState<string | null>(null);
  const height = Math.round(width * 1.15);

  const path = useMemo(() => {
    if (points.length < 2) return '';
    const lat = points.map((p) => p.lat);
    const lng = points.map((p) => p.lng);
    const minLat = Math.min(...lat);
    const maxLat = Math.max(...lat);
    const minLng = Math.min(...lng);
    const maxLng = Math.max(...lng);
    const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
    const w = Math.max((maxLng - minLng) * kx, 1e-9);
    const h = Math.max(maxLat - minLat, 1e-9);
    const box = { w: width * 0.7, h: height * 0.5 };
    const k = Math.min(box.w / w, box.h / h);
    const ox = (width - w * k) / 2;
    const oy = height * 0.12 + (box.h - h * k) / 2;
    return points.map((p) => `${(ox + (p.lng - minLng) * kx * k).toFixed(1)},${(oy + (maxLat - p.lat) * k).toFixed(1)}`).join(' ');
  }, [points, width, height]);

  const pick = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1.15] };
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
      }
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
    } catch {
      // Sem permissão ou cancelado: mantém o fundo atual.
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.card, { width, height }]}>
        {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#14532D' }]} />}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: photo ? 'rgba(0,0,0,0.28)' : 'transparent' }]} />
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          {!!path && (
            <>
              <Polyline points={path} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              <Polyline points={path} fill="none" stroke="#FDBA74" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
        </Svg>
        <View style={styles.bottom}>
          <Text style={styles.big}>{title}</Text>
          <View style={styles.stats}>
            <View>
              <Text style={styles.label}>{tr('Distância')}</Text>
              <Text style={styles.val}>{formatKm(distanceM)} km</Text>
            </View>
            <View>
              <Text style={styles.label}>{tr('Ritmo')}</Text>
              <Text style={styles.val}>{formatPace(distanceM, ms)} /km</Text>
            </View>
            <View>
              <Text style={styles.label}>{tr('Tempo')}</Text>
              <Text style={styles.val}>{clockMs(ms)}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.brand}>Nutri AI</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable style={styles.pickBtn} onPress={() => void pick(true)}>
          <Camera size={18} color="#fff" />
          <Text style={styles.pickText}>{tr('Tirar foto')}</Text>
        </Pressable>
        <Pressable style={styles.pickBtn} onPress={() => void pick(false)}>
          <ImageIcon size={18} color="#fff" />
          <Text style={styles.pickText}>{tr('Escolher da galeria')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    card: { borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' },
    bottom: { padding: 18, gap: 8 },
    big: { fontSize: 44, lineHeight: 48, fontWeight: '900', color: '#FDBA74', letterSpacing: -1, textTransform: 'uppercase' },
    stats: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: font.tiny, color: 'rgba(255,255,255,0.8)' },
    val: { fontSize: font.h3, fontWeight: '800', color: '#fff' },
    brand: { position: 'absolute', top: 14, right: 16, fontSize: font.small, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
    pickBtn: { flex: 1, height: 46, borderRadius: radius.pill, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    pickText: { color: '#fff', fontWeight: '700', fontSize: font.small },
  });
