import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, CircleCheck, ChevronLeft, Drumstick, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlowerChart } from '../components/FlowerChart';
import { MacroSquareCard } from '../components/MacroSquareCard';
import { SCREEN_PADDING, cardBase, colors, font, petalPalette, radius } from '../constants/theme';
import { useDiary } from '../hooks/useDiary';
import { macroPercentages, proteinSources } from '../services/foodCatalog';

function confidenceLabel(value: number): { text: string; color: string } {
  if (value >= 80) return { text: 'Confiança alta', color: colors.primaryDark };
  if (value >= 55) return { text: 'Confiança média', color: colors.carbs };
  return { text: 'Confiança baixa', color: colors.danger };
}

export default function DetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { meals, current, isSaved, saveMeal } = useDiary();
  const [saving, setSaving] = useState(false);

  const meal = meals.find((m) => m.id === id) ?? current;

  if (!meal) {
    return (
      <View style={[styles.root, styles.empty]}>
        <Text style={styles.name}>Refeição não encontrada</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const { analysis, ingredients } = meal;
  const macros = macroPercentages(analysis);
  const total = ingredients.reduce((s, i) => s + i.grams, 0) || 1;
  const saved = isSaved(meal.id);
  const sources = proteinSources(meal);
  const confidence = analysis.confidence !== undefined ? confidenceLabel(analysis.confidence) : null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 96, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Voltar">
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Detalhes</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={{ alignItems: 'center' }}>
          <FlowerChart ingredients={ingredients} centerValue={`${analysis.calories}`} centerLabel="kcal" size={260} />
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.name}>{analysis.food_name}</Text>
          <Text style={styles.weight}>{analysis.estimated_weight_grams} g</Text>
          {confidence && (
            <View style={styles.confidence}>
              <ShieldCheck size={14} color={confidence.color} />
              <Text style={[styles.confidenceText, { color: confidence.color }]}>
                {confidence.text} ({analysis.confidence}%)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.legend}>
          {ingredients.map((ing, idx) => (
            <View key={`${ing.name}-${idx}`} style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: petalPalette[idx % petalPalette.length] }]} />
              <Text style={styles.chipText}>
                {ing.name} {Math.round((ing.grams / total) * 100)}%
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.macroRow}>
          <MacroSquareCard label="Carboidratos" percent={macros.carbs} grams={analysis.carbs_g} color={colors.carbs} />
          <MacroSquareCard label="Proteínas" percent={macros.protein} grams={analysis.protein_g} color={colors.protein} />
          <MacroSquareCard label="Gorduras" percent={macros.fats} grams={analysis.fats_g} color={colors.fats} />
        </View>

        {sources.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Drumstick size={18} color={colors.protein} />
              <Text style={styles.cardTitle}>Proteína neste prato</Text>
              <Text style={styles.cardTotal}>{analysis.protein_g} g</Text>
            </View>
            {sources.map((s) => (
              <View key={s.name} style={styles.proteinRow}>
                <View style={styles.proteinTop}>
                  <Text style={styles.proteinName}>{s.name}</Text>
                  <Text style={styles.proteinValue}>
                    {s.proteinG} g · {s.share}%
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${s.share}%` }]} />
                </View>
              </View>
            ))}
            <Text style={styles.hint}>Valores aproximados, com base nos ingredientes identificados.</Text>
          </View>
        )}

        <Text style={styles.section}>Ingredientes</Text>
        <View style={styles.list}>
          {ingredients.map((ing, idx) => (
            <View key={`${ing.name}-${idx}`} style={[styles.row, idx > 0 && styles.rowBorder]}>
              <View style={[styles.thumb, { backgroundColor: `${petalPalette[idx % petalPalette.length]}22` }]}>
                <MaterialCommunityIcons name={ing.icon} size={18} color={petalPalette[idx % petalPalette.length]} />
              </View>
              <Text style={styles.ingName}>{ing.name}</Text>
              <Text style={styles.ingGrams}>{ing.grams} g</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          disabled={saved || saving}
          style={({ pressed }) => [styles.save, saved && styles.saved, pressed && { opacity: 0.9 }]}
          onPress={async () => {
            setSaving(true);
            try {
              await saveMeal(meal);
              router.navigate('/');
            } catch {
              Alert.alert('Não foi possível salvar', 'Verifique a ligação à internet e tente novamente.');
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {saved ? <CircleCheck size={18} color="#fff" /> : <Bookmark size={18} color="#fff" />}
              <Text style={styles.saveText}>{saved ? 'Salvo no diário' : 'Salvar no meu Diário'}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  link: { color: colors.primary, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backSpacer: { width: 36, height: 36 },
  headerTitle: { fontSize: font.h3, fontWeight: '600', color: colors.text },
  name: { fontSize: font.h1, fontWeight: '700', color: colors.text, textAlign: 'center', letterSpacing: -0.3 },
  weight: { fontSize: font.body, color: colors.textMuted },
  confidence: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  confidenceText: { fontSize: font.small, fontWeight: '600' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: font.small, fontWeight: '500', color: colors.text },
  macroRow: { flexDirection: 'row', gap: 10 },
  card: { ...cardBase, padding: 16, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: font.h3, fontWeight: '600', color: colors.text },
  cardTotal: { fontSize: font.h3, fontWeight: '700', color: colors.protein },
  proteinRow: { gap: 6 },
  proteinTop: { flexDirection: 'row', justifyContent: 'space-between' },
  proteinName: { fontSize: font.body, color: colors.text, flex: 1 },
  proteinValue: { fontSize: font.body, fontWeight: '600', color: colors.text },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.protein },
  hint: { fontSize: font.tiny, color: colors.textFaint },
  section: { fontSize: font.h2, fontWeight: '700', color: colors.text, marginTop: 4 },
  list: { ...cardBase, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  thumb: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  ingName: { flex: 1, fontSize: font.body, fontWeight: '500', color: colors.text },
  ingGrams: { fontSize: font.body, fontWeight: '600', color: colors.text },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SCREEN_PADDING, paddingTop: 10, backgroundColor: colors.background },
  save: { flexDirection: 'row', gap: 8, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saved: { backgroundColor: colors.textFaint },
  saveText: { color: '#fff', fontSize: font.h3, fontWeight: '600' },
});
