import { FontAwesome } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import Svg, { Circle } from 'react-native-svg';
import { radius } from '../constants/theme';

export type PaymentBrand = 'mpesa' | 'emola' | 'visa' | 'mastercard';

interface Props {
  brand: PaymentBrand;
  /** Altura da etiqueta (px). */
  height?: number;
}

/**
 * Logótipos dos meios de pagamento, desenhados no código (sem ficheiros externos).
 * Para usar os logótipos oficiais, troque estes componentes por <Image source={require(...)} />.
 */
export function PaymentLogo({ brand, height = 30 }: Props) {
  const w = Math.round(height * 1.9);
  return (
    <View style={[styles.chip, { height, minWidth: w, borderRadius: Math.min(radius.sm, height / 2.4) }]}>
      {brand === 'mpesa' && (
        <View style={styles.row}>
          <Text style={[styles.word, { fontSize: height * 0.42, color: '#E60000' }]}>M-</Text>
          <Text style={[styles.word, { fontSize: height * 0.42, color: '#00A651' }]}>PESA</Text>
        </View>
      )}
      {brand === 'emola' && (
        <View style={styles.row}>
          <Text style={[styles.word, { fontSize: height * 0.46, color: '#F57C00', fontStyle: 'italic' }]}>e-</Text>
          <Text style={[styles.word, { fontSize: height * 0.46, color: '#F57C00' }]}>Mola</Text>
        </View>
      )}
      {brand === 'visa' && <FontAwesome name="cc-visa" size={height * 0.95} color="#1A1F71" />}
      {brand === 'mastercard' && (
        <Svg width={height * 1.1} height={height * 0.72} viewBox="0 0 44 28">
          <Circle cx="14" cy="14" r="14" fill="#EB001B" />
          <Circle cx="30" cy="14" r="14" fill="#F79E1B" />
          <Circle cx="22" cy="14" r="8" fill="#FF5F00" opacity={0.95} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  row: { flexDirection: 'row', alignItems: 'center' },
  word: { fontWeight: '800', letterSpacing: -0.3 },
});
