import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useSubscription } from '../hooks/useSubscription';
import { tr } from '../i18n';

interface Props {
  children: ReactNode;
  /** O que o recurso faz (mostrado no aviso). */
  feature: string;
  /** Usa-o dentro de um ScrollView, a proteger só uma secção (não ocupa o ecrã todo). */
  inline?: boolean;
}

/**
 * Protege um recurso PRO: no plano FREE o conteúdo fica desfocado (vidro fosco) com um convite
 * para ver os planos. No PRO mostra o conteúdo normalmente.
 */
export function ProGate({ children, feature, inline }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isPro } = useSubscription();
  const router = useRouter();
  if (isPro) return <>{children}</>;

  return (
    <View style={inline ? styles.inline : styles.fill}>
      {children}
      <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <View style={styles.card}>
            <View style={styles.icon}>
              <Sparkles size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>{tr('Recurso Nutri IA Pro')}</Text>
            <Text style={styles.body}>
              {tr(feature)} {tr('Todos os planos Pro têm os mesmos recursos; só muda o período.')}
            </Text>
            <Pressable style={styles.button} onPress={() => router.push('/paywall')}>
              <Text style={styles.buttonText}>{tr('Ver planos')}</Text>
            </Pressable>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

/** Etiqueta "PRO" para atalhos e secções bloqueadas. */
export function ProBadge() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{tr('PRO')}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  fill: { flex: 1 },
  inline: { borderRadius: radius.card, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { ...cardBase(colors), padding: 20, alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.h2, fontWeight: '700', color: colors.text, textAlign: 'center' },
  body: { fontSize: font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, height: 46, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  badge: { backgroundColor: colors.limeSoft, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: colors.lime },
  badgeText: { fontSize: 9, fontWeight: '800', color: colors.limeDark, letterSpacing: 0.5 },
});
