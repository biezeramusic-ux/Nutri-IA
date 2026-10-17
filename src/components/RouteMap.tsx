import { useMemo } from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polyline, Stop } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import type { RoutePoint } from '../services/walks';

const TILE = 256;
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
    return { path, list };
  }, [points, width, height]);

  return (
    <View style={{ width, height, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface }}>
      {tiles &&
        view?.list.map((t) => (
          <Image key={t.key} source={{ uri: t.uri }} style={{ position: 'absolute', left: t.left, top: t.top, width: TILE, height: TILE }} />
        ))}
      <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Defs>
          <LinearGradient id="route" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#16A34A" />
            <Stop offset="1" stopColor="#F97316" />
          </LinearGradient>
        </Defs>
        {view && view.path.length === 1 && (
          <>
            <Circle cx={view.path[0].x} cy={view.path[0].y} r={22} fill="#2563EB" opacity={0.18} />
            <Circle cx={view.path[0].x} cy={view.path[0].y} r={9} fill="#2563EB" stroke="#fff" strokeWidth={3.5} />
          </>
        )}
        {view && view.path.length > 1 && (
          <>
            <Polyline points={view.path.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={view.path.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke="url(#route)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={view.path[0].x} cy={view.path[0].y} r={7} fill="#16A34A" stroke="#fff" strokeWidth={3} />
            <Circle cx={view.path[view.path.length - 1].x} cy={view.path[view.path.length - 1].y} r={7} fill="#F97316" stroke="#fff" strokeWidth={3} />
          </>
        )}
      </Svg>
    </View>
  );
}
