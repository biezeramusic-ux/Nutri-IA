import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { Text } from '../components/AppText';
import { Alert } from '../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useAvatar } from '../hooks/useAvatar';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayName } = useAuth();
  const { profile, saveName } = useProfile();
  const avatar = useAvatar();

  const current = profile?.fullName || displayName;
  const [name, setName] = useState(current);
  const [saving, setSaving] = useState(false);

  // O perfil pode chegar do servidor depois de abrir o ecrã: preenche o nome uma única vez.
  useEffect(() => {
    if (current) setName((prev) => prev || current);
  }, [current]);

  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const pick = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(tr('Permissão necessária'), source === 'camera' ? 'Permita o acesso à câmera nas definições do telemóvel.' : 'Permita o acesso às fotos nas definições do telemóvel.');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled) return;
    if (!(await avatar.set(res.assets[0].uri))) Alert.alert(tr('Não foi possível guardar a foto'), tr('Tente novamente.'));
  };

  const changePhoto = () =>
    Alert.alert(tr('Foto de perfil'), undefined, [
      { text: tr('Tirar foto'), onPress: () => void pick('camera') },
      { text: tr('Escolher da galeria'), onPress: () => void pick('library') },
      ...(avatar.uri ? [{ text: tr('Remover foto'), style: 'destructive' as const, onPress: avatar.clear }] : []),
      { text: tr('Cancelar'), style: 'cancel' as const },
    ]);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert(tr('Nome inválido'), tr('Escreva o seu nome (mínimo 2 letras).'));
      return;
    }
    setSaving(true);
    try {
      if (trimmed !== current) await saveName(trimmed);
      router.back();
    } catch {
      Alert.alert(tr('Não foi possível guardar'), tr('Verifique a ligação à internet e tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 110, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={tr('Editar perfil')} />

        <View style={styles.avatarWrap}>
          <Pressable onPress={changePhoto} accessibilityLabel={tr('Alterar foto de perfil')}>
            {avatar.uri ? (
              <Image source={{ uri: avatar.uri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
            <View style={styles.camBadge}>
              <Camera size={14} color="#fff" />
            </View>
          </Pressable>
          <Pressable onPress={changePhoto}>
            <Text style={styles.changeText}>{avatar.uri ? 'Alterar foto' : 'Adicionar foto'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{tr('Nome')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={tr('O seu nome')}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            maxLength={60}
            autoCapitalize="words"
          />
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={() => void save()} disabled={saving} style={({ pressed }) => [styles.cta, (pressed || saving) && { opacity: 0.85 }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{tr('Guardar')}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    avatarWrap: { alignItems: 'center', gap: 10 },
    avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: colors.card },
    avatarEmpty: { backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: 36, fontWeight: '700', color: '#0B1F3A' },
    camBadge: { position: 'absolute', right: 0, bottom: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
    changeText: { fontSize: font.body, fontWeight: '600', color: colors.primaryDark },
    card: { ...cardBase(colors), padding: 16, gap: 10 },
    label: { fontSize: font.small, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
    input: { height: 48, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 14, fontSize: font.body, color: colors.text },
    bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: SCREEN_PADDING, paddingTop: 12 },
    cta: { height: 50, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '700' },
  });
