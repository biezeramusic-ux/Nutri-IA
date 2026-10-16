import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Polyline, Stop } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import type { RoutePoint } from '../services/walks';

/** Rota desenhada (sem mapa de fundo): início a verde, fim a laranja, com grelha discreta. */
export function RouteMap({ points, width, height = 220 }: { points: RoutePoint[]; width: number; height?: number }) {
  const { colors } = useTheme();
  const pad = 22;

  const path = useMemo(() => {
    if (points.length < 2) return null;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const midLat = (minLat + maxLat) / 2;
    const kx = Math.cos((midLat * Math.PI) / 180);
    const w = Math.max((maxLng - minLng) * kx, 1e-6);
    const h = Math.max(maxLat - minLat, 1e-6);
    const scale = Math.min((width - pad * 2) / w, (height - pad * 2) / h);
    const offX = (width - w * scale) / 2;
    const offY = (height - h * scale) / 2;
    return points.map((p) => ({ x: offX + (p.lng - minLng) * kx * scale, y: height - (offY + (p.lat - minLat) * scale) }));
  }, [points, width, height]);

  return (
    <View style={{ width, height, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="route" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#2E9E4F" />
            <Stop offset="1" stopColor="#F08A4B" />
          </LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <Line key={`h${g}`} x1={0} x2={width} y1={height * g} y2={height * g} stroke={colors.border} strokeDasharray="3 6" />
        ))}
        {[0.25, 0.5, 0.75].map((g) => (
          <Line key={`v${g}`} y1={0} y2={height} x1={width * g} x2={width * g} stroke={colors.border} strokeDasharray="3 6" />
        ))}
        {path && (
          <>
            <Polyline points={path.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke={colors.card} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={path.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke="url(#route)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={path[0].x} cy={path[0].y} r={7} fill="#2E9E4F" stroke="#fff" strokeWidth={3} />
            <Circle cx={path[path.length - 1].x} cy={path[path.length - 1].y} r={7} fill="#F08A4B" stroke="#fff" strokeWidth={3} />
          </>
        )}
      </Svg>
    </View>
  );
}
