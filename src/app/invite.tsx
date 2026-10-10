import { Send, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../components/AppText';
import { Alert } from '../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { SCREEN_PADDING, cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useReferral } from '../hooks/useReferral';
import { useTheme } from '../hooks/useTheme';
import { REDEEM_MESSAGES, redeemReferral } from '../services/repositories/referral';
import { tr } from '../i18n';

export default function InviteScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { code, invited, needed, discountPct, failed, refresh } = useReferral();
  const [entered, setEntered] = useState('');
  const [busy, setBusy] = useState(false);

  const missing = Math.max(0, needed - invited);
  const pct = Math.min(1, invited / needed);

  const share = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: tr('Estou a usar o Nutri IA para contar calorias com uma foto do prato. Use o meu código {code} ao criar a conta e ganhe 3 dias grátis.', { code }),
      });
    } catch {
      // partilha cancelada
    }
  };

  const redeem = async () => {
    const value = entered.trim();
    if (value.length < 4) return;
    setBusy(true);
    try {
      const result = await redeemReferral(value);
      if (result.ok) {
        Alert.alert(tr('Código aceite'), tr('Obrigado! O seu amigo conta como convidado.'));
        setEntered('');
      } else {
        Alert.alert(tr('Código não aceite'), REDEEM_MESSAGES[result.error]);
      }
    } catch {
      Alert.alert(tr('Sem ligação'), tr('Não foi possível validar o código agora. Tente novamente.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={tr('Convidar amigos')} />

        <View style={styles.hero}>
          <Text style={{ fontSize: 34 }}>🎁</Text>
          <Text style={styles.heroTitle}>{tr('Convide {needed} amigos e ganhe 5% de desconto', { needed })}</Text>
          <Text style={styles.heroSub}>{tr('O desconto vale para todos os planos Pro. Só contam amigos que criam a conta e concluem o quiz.')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowIcon}>
              <Users size={16} color={colors.primaryDark} />
              <Text style={styles.cardTitle}>{tr('Convidados')}</Text>
            </View>
            <Text style={styles.count}>
              {invited}/{needed}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct * 100}%` }]} />
          </View>
          <Text style={styles.sub}>
            {discountPct > 0 ? tr('Desconto de {pct}% ativo em todos os planos.', { pct: discountPct }) : tr(missing === 1 ? 'Falta 1 convite para o desconto.' : 'Faltam {n} convites para o desconto.', { n: missing })}
          </Text>
          {failed && (
            <Pressable onPress={() => void refresh()}>
              <Text style={styles.link}>{tr('Sem ligação ao servidor. Tocar para tentar de novo.')}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr('O seu código')}</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code} selectable>
              {code || '······'}
            </Text>
          </View>
          <Pressable style={[styles.cta, !code && { opacity: 0.6 }]} disabled={!code} onPress={() => void share()}>
            <Send size={16} color="#fff" />
            <Text style={styles.ctaText}>{tr('Partilhar convite')}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr('Tenho um código de convite')}</Text>
          <TextInput
            value={entered}
            onChangeText={(t) => setEntered(t.toUpperCase())}
            placeholder={tr('NUTRI-XXXXXX')}
            placeholderTextColor={colors.textFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            maxLength={14}
          />
          <Pressable style={[styles.secondary, (busy || entered.trim().length < 4) && { opacity: 0.6 }]} disabled={busy || entered.trim().length < 4} onPress={() => void redeem()}>
            {busy ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={styles.secondaryText}>{tr('Usar código')}</Text>}
          </Pressable>
          <Text style={styles.sub}>{tr('Só pode usar um código, nos primeiros 7 dias da conta.')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    hero: { backgroundColor: colors.lime, borderRadius: radius.card, padding: 18, gap: 6 },
    heroTitle: { fontSize: font.h2, fontWeight: '800', color: '#0B1F3A' },
    heroSub: { fontSize: font.small, color: '#0B1F3A', lineHeight: 18 },
    card: { ...cardBase(colors), padding: 16, gap: 12 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowIcon: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: font.h3, fontWeight: '600', color: colors.text },
    count: { fontSize: font.h2, fontWeight: '800', color: colors.primaryDark },
    track: { height: 10, borderRadius: 5, backgroundColor: colors.surface, overflow: 'hidden' },
    fill: { height: 10, borderRadius: 5, backgroundColor: colors.primary },
    sub: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
    link: { fontSize: font.small, color: colors.primaryDark, fontWeight: '600' },
    codeBox: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', paddingVertical: 14 },
    code: { fontSize: 26, fontWeight: '800', letterSpacing: 2, color: colors.text },
    cta: { flexDirection: 'row', gap: 8, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: font.body },
    input: { height: 48, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 14, fontSize: font.body, color: colors.text, letterSpacing: 1 },
    secondary: { height: 46, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    secondaryText: { color: colors.primaryDark, fontWeight: '600', fontSize: font.body },
  });
