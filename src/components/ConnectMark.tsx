import { Footprints, Link2 } from 'lucide-react-native';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

/** Símbolo de ligar a saúde: pegadas num disco verde com um pequeno elo de ligação. */
export function ConnectMark({ size = 40 }: { size?: number }) {
  const badge = Math.round(size * 0.42);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <LinearGradient id="cm" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#334155" />
            <Stop offset="1" stopColor="#0F172A" />
          </LinearGradient>
        </Defs>
        <Circle cx="20" cy="20" r="20" fill="url(#cm)" />
        <Circle cx="20" cy="20" r="16.5" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1} />
      </Svg>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Footprints size={size * 0.5} color="#fff" />
      </View>
      <View
        style={{
          position: 'absolute',
          right: -size * 0.08,
          bottom: -size * 0.08,
          width: badge,
          height: badge,
          borderRadius: badge / 2,
          backgroundColor: '#2563EB',
          borderWidth: 2,
          borderColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link2 size={badge * 0.6} color="#fff" />
      </View>
    </View>
  );
}
