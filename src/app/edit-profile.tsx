import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumberStepper } from '../components/quiz/NumberStepper';
import { QuizChip } from '../components/quiz/QuizChip';
import { ScreenHeader } from '../components/ScreenHeader';
import { SegmentedControl } from '../components/SegmentedControl';
import { ACTIVITY_LABEL, GOAL_LABEL } from '../constants/labels';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import type { ActivityLevel, GoalType, QuizAnswers, Sex } from '../types';

const SEX_OPTIONS: { key: Sex; label: string }[] = [
  { key: 'female', label: 'Mulher' },
  { key: 'male', label: 'Homem' },
];

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayName } = useAuth();
  const { profile, completeOnboarding, saveName } = useProfile();
  const quiz = profile?.quiz ?? null;

  const [name, setName] = useState(profile?.fullName || displayName);
  const [form, setForm] = useState<QuizAnswers | null>(quiz);
  const [saving, setSaving] = useState(false);

  // O perfil pode chegar do servidor depois de abrir o ecrã: preenche uma única vez.
  useEffect(() => {
    if (quiz) setForm((prev) => prev ?? quiz);
    if (profile?.fullName || displayName) setName((prev) => prev || profile?.fullName || displayName);
  }, [quiz, profile?.fullName, displayName]);

  const update = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert('Nome inválido', 'Escreva o seu nome (mínimo 2 letras).');
      return;
    }
    setSaving(true);
    try {
      if (trimmed !== (profile?.fullName || displayName)) await saveName(trimmed);
      if (form) await completeOnboarding(form);
      router.back();
    } catch (e) {
      const detail = e instanceof Error && e.message ? `\n\nDetalhe: ${e.message}` : '';
      Alert.alert('Não foi possível guardar', `Verifique a ligação à internet e tente novamente.${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 110, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Editar perfil" />

        <View style={styles.card}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="O seu nome"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            maxLength={60}
            autoCapitalize="words"
          />
        </View>

        {form ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Sexo</Text>
              <SegmentedControl options={SEX_OPTIONS} value={form.sex} onChange={(v) => update('sex', v)} />
              <NumberStepper label="Idade" value={form.age} unit="anos" min={10} max={100} onChange={(v) => update('age', v)} />
              <NumberStepper label="Altura" value={form.heightCm} unit="cm" min={100} max={250} onChange={(v) => update('heightCm', v)} />
              <NumberStepper label="Peso atual" value={form.weightKg} unit="kg" min={30} max={300} onChange={(v) => update('weightKg', v)} />
              <NumberStepper label="Peso desejado" value={form.targetWeightKg} unit="kg" min={30} max={300} onChange={(v) => update('targetWeightKg', v)} />
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Objetivo</Text>
              <View style={styles.chips}>
                {(Object.keys(GOAL_LABEL) as GoalType[]).map((g) => (
                  <QuizChip key={g} label={GOAL_LABEL[g]} selected={form.goal === g} onPress={() => update('goal', g)} />
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Nível de atividade</Text>
              <View style={styles.chips}>
                {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((a) => (
                  <QuizChip key={a} label={ACTIVITY_LABEL[a]} selected={form.activity === a} onPress={() => update('activity', a)} />
                ))}
              </View>
            </View>

            <Text style={styles.note}>
              Ao guardar, as metas diárias de calorias, macros e água são recalculadas com estes dados.
            </Text>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.note}>Faça primeiro o quiz inicial para poder editar o seu peso, altura e objetivo.</Text>
            <Pressable style={styles.secondary} onPress={() => router.replace('/quiz')}>
              <Text style={styles.secondaryText}>Fazer o quiz</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={() => void save()} disabled={saving} style={({ pressed }) => [styles.cta, (pressed || saving) && { opacity: 0.85 }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Guardar alterações</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    card: { ...cardBase(colors), padding: 16, gap: 12 },
    label: { fontSize: font.small, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
    input: { height: 48, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 14, fontSize: font.body, color: colors.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    note: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
    secondary: { height: 46, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    secondaryText: { color: colors.primaryDark, fontWeight: '600', fontSize: font.body },
    bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: SCREEN_PADDING, paddingTop: 12 },
    cta: { height: 50, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '700' },
  });
