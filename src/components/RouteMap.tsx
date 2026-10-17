import { useMemo } from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { Text } from './AppText';
import { distanceBetween, type RoutePoint } from '../services/walks';
import { tr } from '../i18n';

const TILE = 256;

/** Cor do troço pela velocidade (km/h): azul lento, verde, amarelo, laranja, vermelho rápido. */
const SPEED_COLORS = ['#3B82F6', '#22C55E', '#FACC15', '#F97316', '#EF4444'];
const speedColor = (kmh: number) => SPEED_COLORS[kmh < 4 ? 0 : kmh < 6 ? 1 : kmh < 8 ? 2 : kmh < 10 ? 3 : 4];
const worldX = (lng: number, z: number) => ((lng + 180) / 360) * TILE * 2 ** z;
const worldY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * TILE * 2 ** z;
};

/**
 * Mapa do percurso: mosaicos do OpenStreetMap por baixo e a rota por cima (início verde, fim laranja).
 * Sem internet, os mosaicos não aparecem e fica a rota sobre uma grelha.
 */
export function RouteMap({ points, width, height = 220, tiles = true }: { points: RoutePoint[]; width: number; height?: number; tiles?: boolean }) {
  const { colors } = useTheme();
  const pad = 34;

  const view = useMemo(() => {
    if (points.length < 1) return null;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const bw0 = Math.max(worldX(maxLng, 0) - worldX(minLng, 0), 1e-9);
    const bh0 = Math.max(worldY(minLat, 0) - worldY(maxLat, 0), 1e-9);
    const fit = Math.min((width - pad * 2) / bw0, (height - pad * 2) / bh0);
    const z = points.length === 1 ? 16 : Math.max(1, Math.min(17, Math.floor(Math.log2(fit))));
    const cx = (worldX(minLng, z) + worldX(maxLng, z)) / 2;
    const cy = (worldY(minLat, z) + worldY(maxLat, z)) / 2;
    const ox = cx - width / 2;
    const oy = cy - height / 2;
    const path = points.map((p) => ({ x: worldX(p.lng, z) - ox, y: worldY(p.lat, z) - oy }));
    const tx0 = Math.floor(ox / TILE);
    const tx1 = Math.floor((ox + width) / TILE);
    const ty0 = Math.floor(oy / TILE);
    const ty1 = Math.floor((oy + height) / TILE);
    const max = 2 ** z;
    const list: { key: string; uri: string; left: number; top: number }[] = [];
    for (let tx = tx0; tx <= tx1; tx++)
      for (let ty = ty0; ty <= ty1; ty++) {
        if (ty < 0 || ty >= max) continue;
        const wx = ((tx % max) + max) % max;
        list.push({ key: `${z}-${tx}-${ty}`, uri: `https://tile.openstreetmap.org/${z}/${wx}/${ty}.png`, left: tx * TILE - ox, top: ty * TILE - oy });
      }
    // Velocidade de cada troço, suavizada com os vizinhos, para colorir o percurso.
    const raw = points.slice(1).map((p, i) => {
      const dt = Math.max(1, (p.t - points[i].t) / 1000);
      return (distanceBetween(points[i], p) / dt) * 3.6;
    });
    const smooth = raw.map((_, i) => {
      const win = raw.slice(Math.max(0, i - 2), i + 3);
      return win.reduce((a, b) => a + b, 0) / win.length;
    });
    const segs = smooth.map((kmh, i) => ({ a: path[i], b: path[i + 1], color: speedColor(kmh) }));
    return { path, list, segs };
  }, [points, width, height]);

  return (
    <View style={{ width, height, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface }}>
      {tiles &&
        view?.list.map((t) => (
          <Image key={t.key} source={{ uri: t.uri }} style={{ position: 'absolute', left: t.left, top: t.top, width: TILE, height: TILE }} />
        ))}
      <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
        {view && view.path.length === 1 && (
          <>
            <Circle cx={view.path[0].x} cy={view.path[0].y} r={22} fill="#2563EB" opacity={0.18} />
            <Circle cx={view.path[0].x} cy={view.path[0].y} r={9} fill="#2563EB" stroke="#fff" strokeWidth={3.5} />
          </>
        )}
        {view && view.path.length > 1 && (
          <>
            <Polyline points={view.path.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            {view.segs.map((sg, i) => (
              <Line key={i} x1={sg.a.x} y1={sg.a.y} x2={sg.b.x} y2={sg.b.y} stroke={sg.color} strokeWidth={5.5} strokeLinecap="round" />
            ))}
            <Circle cx={view.path[0].x} cy={view.path[0].y} r={7} fill="#16A34A" stroke="#fff" strokeWidth={3} />
            <Circle cx={view.path[view.path.length - 1].x} cy={view.path[view.path.length - 1].y} r={7} fill="#F97316" stroke="#fff" strokeWidth={3} />
          </>
        )}
      </Svg>
      {view && view.path.length > 1 && (
        <View style={{ position: 'absolute', left: 10, bottom: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, gap: 3 }}>
          <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', width: 96 }}>
            {SPEED_COLORS.map((c) => (
              <View key={c} style={{ flex: 1, backgroundColor: c }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 9, color: '#475569' }}>{tr('Lento')}</Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>{tr('Rápido')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
