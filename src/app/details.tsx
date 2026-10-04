import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlowerChart } from '../components/FlowerChart';
import { MacroSquareCard } from '../components/MacroSquareCard';
import { colors, petalPalette, radius, shadow } from '../constants/theme';
import { useDiary } from '../hooks/useDiary';
import { macroPercentages } from '../services/foodCatalog';

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

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Detalhes</Text>
          <View style={styles.back} />
        </View>

        <FlowerChart ingredients={ingredients} centerValue={`${analysis.calories}`} centerLabel="kcal" size={310} />

        <Text style={styles.name}>{analysis.food_name}</Text>
        <Text style={styles.weight}>{analysis.estimated_weight_grams} g</Text>

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

        <Text style={styles.section}>Ingredientes</Text>
        <View style={styles.list}>
          {ingredients.map((ing, idx) => (
            <View key={`${ing.name}-${idx}`} style={[styles.row, idx > 0 && styles.rowBorder]}>
              <View style={[styles.thumb, { backgroundColor: `${petalPalette[idx % petalPalette.length]}22` }]}>
                <MaterialCommunityIcons name={ing.icon} size={22} color={petalPalette[idx % petalPalette.length]} />
              </View>
              <Text style={styles.ingName}>{ing.name}</Text>
              <Text style={styles.ingGrams}>{ing.grams} g</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          disabled={saved || saving}
          style={[styles.save, saved && styles.saved]}
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
              <Ionicons name={saved ? 'checkmark-circle' : 'bookmark'} size={20} color="#fff" />
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
  link: { color: colors.primary, fontWeight: '800' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  name: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 8 },
  weight: { fontSize: 14, color: colors.textMuted, textAlign: 'center', fontWeight: '600', marginBottom: 14 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  macroRow: { flexDirection: 'row', gap: 12 },
  section: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 26, marginBottom: 12 },
  list: { backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 16, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  thumb: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ingName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  ingGrams: { fontSize: 15, fontWeight: '800', color: colors.text },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.background },
  save: { flexDirection: 'row', gap: 8, height: 56, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saved: { backgroundColor: colors.textMuted },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
