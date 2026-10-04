import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SPACE, colors, radius, shadow } from '../../constants/theme';
import { useFasting } from '../../hooks/useFasting';
import { useWater } from '../../hooks/useWater';

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const water = useWater();
  const fasting = useFasting();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE + 40, gap: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Tracker</Text>
      {(water.error || fasting.error) && <Text style={styles.error}>{water.error ?? fasting.error}</Text>}

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.iconBubble, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="water" size={22} color={colors.protein} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Hidratação</Text>
            <Text style={styles.cardSub}>Beba água nos dias quentes 💧</Text>
          </View>
        </View>

        <View style={styles.glassRow}>
          {Array.from({ length: water.goal }).map((_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={i < water.glasses ? 'cup-water' : 'cup-outline'}
              size={30}
              color={i < water.glasses ? colors.protein : '#CFD8DC'}
            />
          ))}
        </View>

        <View style={styles.counterRow}>
          <Pressable style={styles.roundBtn} onPress={water.decrement} accessibilityLabel="Menos um copo">
            <Ionicons name="remove" size={26} color={colors.text} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.big}>
              {water.glasses}
              <Text style={styles.bigSub}> / {water.goal}</Text>
            </Text>
            <Text style={styles.cardSub}>copos hoje</Text>
          </View>
          <Pressable style={[styles.roundBtn, styles.roundPrimary]} onPress={water.increment} accessibilityLabel="Mais um copo">
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.iconBubble, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="timer" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Jejum Intermitente</Text>
            <Text style={styles.cardSub}>Meta: {fasting.goalHours} horas</Text>
          </View>
        </View>

        <Text style={styles.clock}>{fasting.display}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${fasting.progress * 100}%` }]} />
        </View>
        <Text style={styles.cardSub}>
          {fasting.running ? `${Math.round(fasting.progress * 100)}% da meta` : 'Toque em iniciar quando fizer a última refeição'}
        </Text>

        <Pressable
          style={[styles.action, fasting.running && styles.actionStop]}
          disabled={fasting.busy}
          onPress={() => void (fasting.running ? fasting.stop() : fasting.start())}
        >
          <Ionicons name={fasting.running ? 'stop' : 'play'} size={18} color="#fff" />
          <Text style={styles.actionText}>{fasting.running ? 'Terminar jejum' : 'Iniciar jejum'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  error: { fontSize: 12, color: colors.danger },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, gap: 16, ...shadow },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBubble: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: 12, color: colors.textMuted },
  glassRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  roundPrimary: { backgroundColor: colors.protein },
  big: { fontSize: 40, fontWeight: '800', color: colors.text },
  bigSub: { fontSize: 20, color: colors.textMuted },
  clock: { fontSize: 46, fontWeight: '800', color: colors.text, textAlign: 'center', fontVariant: ['tabular-nums'] },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.background, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5, backgroundColor: colors.primary },
  action: { flexDirection: 'row', gap: 8, height: 54, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionStop: { backgroundColor: colors.danger },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
