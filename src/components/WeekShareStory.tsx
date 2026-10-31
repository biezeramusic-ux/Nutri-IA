import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Image as ImageIcon, Share2, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, Modal, Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from './AppText';
import { font, radius } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { Link2 } from 'lucide-react-native';
import { todayKey } from '../services/date';
import { WEEKDAY_LABELS, mealsOfDay, sumMeals, weekDays } from '../services/dayUtils';
import { computeStreak } from '../services/streak';
import { buildWeeklyReport } from '../services/weeklyReport';
import { tr } from '../i18n';
import type { DailyGoals, Meal } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  meals: Meal[];
  goals: DailyGoals;
  name: string;
  inviteCode?: string;
}

/** Letras que entram uma a uma. */
function Letters({ text, start, style, per = 45 }: { text: string; start: number; style: object; per?: number }) {
  const chars = useMemo(() => Array.from(text), [text]);
  const vals = useRef<Animated.Value[]>([]);
  if (vals.current.length !== chars.length) vals.current = chars.map(() => new Animated.Value(0));
  useEffect(() => {
    vals.current.forEach((v) => v.setValue(0));
    const anim = Animated.stagger(per, vals.current.map((v) => Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true })));
    const t = setTimeout(() => anim.start(), start);
    return () => {
      clearTimeout(t);
      anim.stop();
    };
  }, [text, start, per]);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {chars.map((c, i) => (
        <Animated.Text key={i} style={[style, { opacity: vals.current[i], transform: [{ translateY: vals.current[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          {c === ' ' ? ' ' : c}
        </Animated.Text>
      ))}
    </View>
  );
}

function FadeIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [delay, v]);
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>{children}</Animated.View>;
}

function Flame({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 24 30">
      <Path d="M12 1c1 5 6 8 6 15a6 6 0 0 1-12 0c0-2 .8-3.6 2-5 .3 1.6 1.2 2.4 2 2.6C9.600 9 10.400 4.600 12 1z" fill="#FDBA74" />
      <Path d="M12 14c.6 2.400 3 3.400 3 6.200a3 3 0 0 1-6 0c0-1.800 1.600-3 3-6.200z" fill="#FFF7ED" />
    </Svg>
  );
}

/** Cartão vertical (formato story) com o resumo da semana. A pessoa pode pôr uma foto de fundo ou usar o fundo verde. */
export function WeekShareStory({ visible, onClose, meals, goals, name, inviteCode }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<View>(null);

  const cardH = Math.min(height - insets.top - insets.bottom - 170, (width - 40) * 1.78);
  const cardW = cardH / 1.78;

  const data = useMemo(() => {
    const days = weekDays(new Date());
    const perDay = days.map((d) => sumMeals(mealsOfDay(meals, todayKey(d))));
    const logged = perDay.filter((t) => t.kcal > 0);
    const n = Math.max(logged.length, 1);
    const avg = (pick: (t: (typeof perDay)[number]) => number) => Math.round(logged.reduce((s, t) => s + pick(t), 0) / n);
    return { perDay, days: logged.length, kcal: avg((t) => t.kcal), protein: avg((t) => t.protein), carbs: avg((t) => t.carbs), fats: avg((t) => t.fats), streak: computeStreak(meals).current };
  }, [meals]);

  useEffect(() => {
    if (!visible) return;
    setReady(false);
    setRun((r) => r + 1);
    const t = setTimeout(() => setReady(true), 3600);
    return () => clearTimeout(t);
  }, [visible, photo]);

  const pick = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [9, 16] };
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
      }
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
    } catch {
      // cancelado ou sem permissão: mantém o fundo atual
    }
  };

  const capture = async (base64: boolean) => {
    // Carregado só aqui para a app não falhar caso o módulo nativo não exista.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { captureRef } = require('react-native-view-shot') as typeof import('react-native-view-shot');
    return captureRef(cardRef, { format: 'png', quality: 1, result: base64 ? 'base64' : 'tmpfile' });
  };

  const share = async () => {
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sharing = require('expo-sharing') as typeof import('expo-sharing');
      const uri = await capture(false);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: tr('Partilhar resumo da semana') });
        return;
      }
      throw new Error('sem partilha');
    } catch {
      await Share.share({ message: buildWeeklyReport(meals, goals, name, inviteCode) }).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  /** Partilha direto para os Stories do Instagram ou do Facebook (exige o APK; no Expo Go cai na partilha normal). */
  const shareStory = async (target: 'instagram' | 'facebook') => {
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const RNShare = (require('react-native-share') as typeof import('react-native-share')).default;
      const b64 = await capture(true);
      const appId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';
      await RNShare.shareSingle({
        social: target === 'instagram' ? RNShare.Social.INSTAGRAM_STORIES : RNShare.Social.FACEBOOK_STORIES,
        appId,
        backgroundImage: `data:image/png;base64,${b64}`,
        backgroundBottomColor: '#0F4D2A',
        backgroundTopColor: '#166534',
      } as never);
    } catch (e) {
      const cancelled = String((e as { message?: string })?.message ?? '').toLowerCase().includes('cancel') || String((e as { message?: string })?.message ?? '').toLowerCase().includes('dismiss');
      if (!cancelled) {
        Alert.alert(target === 'instagram' ? tr('Instagram não encontrado') : tr('Facebook não encontrado'), tr('Use o botão Imagem para partilhar noutras apps.'));
      }
    } finally {
      setBusy(false);
    }
  };

  /** Envia a imagem para o armazenamento público e partilha o link: quem o abrir vê o cartão. */
  const shareLink = async () => {
    setBusy(true);
    try {
      if (!isSupabaseConfigured || !user) throw new Error('sem conta');
      const b64 = await capture(true);
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const path = `${user.id}/${Date.now()}.png`;
      const up = await supabase.storage.from('weekly-shares').upload(path, bytes, { contentType: 'image/png' });
      if (up.error) throw up.error;
      const url = supabase.storage.from('weekly-shares').getPublicUrl(path).data.publicUrl;
      const text = name ? tr('Veja o meu resumo da semana no Nutrifitness AI, {name}', { name }) : tr('Veja o meu resumo da semana no Nutrifitness AI');
      await Share.share({ message: `${text}\n${url}`, url });
    } catch {
      Alert.alert(tr('Não foi possível criar o link'), tr('Verifique a ligação à internet e tente de novo.'));
    } finally {
      setBusy(false);
    }
  };

  const maxKcal = Math.max(goals.calories, ...data.perDay.map((t) => t.kcal), 1);
  const barH = cardH * 0.16;
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.top}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <X size={20} color="#fff" />
          </Pressable>
          <Text style={styles.topTitle}>{tr('Partilhar resumo da semana')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ alignItems: 'center', gap: 14, paddingVertical: 6 }} showsVerticalScrollIndicator={false}>
          <View ref={cardRef} collapsable={false} style={[styles.card, { width: cardW, height: cardH }]}>
            {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <LinearGradient colors={['#166534', '#22A559', '#0F4D2A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />}
            {photo && <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />}

            <View key={run} style={{ flex: 1, padding: cardW * 0.08, justifyContent: 'space-between' }}>
              <View style={{ gap: 4 }}>
                <FadeIn delay={0}>
                  <Text style={styles.brand}>Nutrifitness AI</Text>
                </FadeIn>
                <Letters text={name ? tr('Semana de {name}', { name }) : tr('A minha semana')} start={250} style={[styles.title, { fontSize: cardW * 0.115, lineHeight: cardW * 0.13 }]} />
              </View>

              <View style={{ gap: cardH * 0.025 }}>
                <FadeIn delay={1300}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Flame size={cardW * 0.14} />
                    <View>
                      <Text style={[styles.big, { fontSize: cardW * 0.17 }]}>{data.streak}</Text>
                      <Text style={styles.label}>{data.streak === 1 ? tr('dia seguido') : tr('dias seguidos')}</Text>
                    </View>
                  </View>
                </FadeIn>

                <FadeIn delay={1700}>
                  <View style={{ flexDirection: 'row', gap: 22 }}>
                    <View>
                      <Text style={[styles.val, { fontSize: cardW * 0.1 }]}>{data.kcal}</Text>
                      <Text style={styles.label}>{tr('kcal por dia')}</Text>
                    </View>
                    <View>
                      <Text style={[styles.val, { fontSize: cardW * 0.1 }]}>{data.days}/7</Text>
                      <Text style={styles.label}>{tr('dias com registo')}</Text>
                    </View>
                  </View>
                </FadeIn>

                <FadeIn delay={2100}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      [tr('Proteína'), data.protein],
                      [tr('Carboidratos'), data.carbs],
                      [tr('Gordura'), data.fats],
                    ].map(([l, v]) => (
                      <View key={String(l)} style={styles.pill}>
                        <Text style={styles.pillVal}>{v} g</Text>
                        <Text style={styles.pillLabel}>{l}</Text>
                      </View>
                    ))}
                  </View>
                </FadeIn>

                <FadeIn delay={2500}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: barH + 18 }}>
                    {data.perDay.map((t, i) => (
                      <View key={i} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                        <View style={{ width: cardW * 0.07, height: Math.max(4, (t.kcal / maxKcal) * barH), borderRadius: 6, backgroundColor: i === todayIdx ? '#FDBA74' : 'rgba(255,255,255,0.85)', opacity: t.kcal > 0 ? 1 : 0.3 }} />
                        <Text style={styles.dayLabel}>{WEEKDAY_LABELS[i].charAt(0)}</Text>
                      </View>
                    ))}
                  </View>
                </FadeIn>

                {!!inviteCode && (
                  <FadeIn delay={2900}>
                    <Text style={styles.invite}>{tr('Código de convite: {code}', { code: inviteCode })}</Text>
                  </FadeIn>
                )}
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, width: cardW }}>
            <Pressable style={styles.pickBtn} onPress={() => void pick(true)}>
              <Camera size={17} color="#fff" />
              <Text style={styles.pickText}>{tr('Tirar foto')}</Text>
            </Pressable>
            <Pressable style={styles.pickBtn} onPress={() => void pick(false)}>
              <ImageIcon size={17} color="#fff" />
              <Text style={styles.pickText}>{tr('Escolher da galeria')}</Text>
            </Pressable>
          </View>
          {photo && (
            <Pressable onPress={() => setPhoto(null)}>
              <Text style={styles.noPhoto}>{tr('Usar fundo verde')}</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[styles.shareBtn, { flex: 1, backgroundColor: '#C13584' }, (!ready || busy) && { opacity: 0.6 }]} disabled={!ready || busy} onPress={() => void shareStory('instagram')}>
              <Text style={styles.shareText}>{tr('Story Instagram')}</Text>
            </Pressable>
            <Pressable style={[styles.shareBtn, { flex: 1, backgroundColor: '#1877F2' }, (!ready || busy) && { opacity: 0.6 }]} disabled={!ready || busy} onPress={() => void shareStory('facebook')}>
              <Text style={styles.shareText}>{tr('Story Facebook')}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[styles.shareBtn, { flex: 1 }, (!ready || busy) && { opacity: 0.6 }]} disabled={!ready || busy} onPress={() => void share()}>
              <Share2 size={17} color="#fff" />
              <Text style={styles.shareText}>{tr('Outras apps')}</Text>
            </Pressable>
            <Pressable style={[styles.shareBtn, { flex: 1, backgroundColor: '#475569' }, (!ready || busy) && { opacity: 0.6 }]} disabled={!ready || busy} onPress={() => void shareLink()}>
              <Link2 size={17} color="#fff" />
              <Text style={styles.shareText}>{tr('Link')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1410', paddingHorizontal: 20, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#fff', fontSize: font.body, fontWeight: '700' },
  card: { borderRadius: 28, overflow: 'hidden', backgroundColor: '#166534' },
  brand: { fontSize: font.small, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  title: { color: '#fff', fontWeight: '900', letterSpacing: -0.5 },
  big: { color: '#fff', fontWeight: '900', lineHeight: undefined },
  val: { color: '#fff', fontWeight: '800' },
  label: { fontSize: font.small, color: 'rgba(255,255,255,0.8)' },
  pill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, paddingVertical: 8, alignItems: 'center' },
  pillVal: { color: '#fff', fontWeight: '800', fontSize: font.body },
  pillLabel: { color: 'rgba(255,255,255,0.8)', fontSize: font.tiny },
  dayLabel: { fontSize: font.tiny, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  invite: { fontSize: font.small, color: 'rgba(255,255,255,0.9)', fontWeight: '700', textAlign: 'center' },
  pickBtn: { flex: 1, height: 44, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  pickText: { color: '#fff', fontWeight: '700', fontSize: font.small },
  noPhoto: { color: 'rgba(255,255,255,0.75)', fontSize: font.small, textDecorationLine: 'underline' },
  shareBtn: { height: 48, borderRadius: radius.pill, backgroundColor: '#22A559', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareText: { color: '#fff', fontWeight: '800', fontSize: font.small },
});
