import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { Logo } from './Logo';

/**
 * Guard do Root Layout: sem sessão, todas as rotas (exceto /auth/*) redirecionam para o login;
 * com sessão, /auth/* redireciona para a Home. Enquanto decide, cobre o ecrã com um splash
 * para que conteúdo protegido nunca "pisque".
 */
export function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const inAuthGroup = segments[0] === 'auth';
  const navigatorReady = !!navigationState?.key;

  useEffect(() => {
    if (loading || !navigatorReady) return;
    if (!session && !inAuthGroup) router.replace('/auth/login');
    else if (session && inAuthGroup) router.replace('/');
  }, [session, loading, inAuthGroup, navigatorReady, router]);

  const redirecting = !loading && ((!session && !inAuthGroup) || (!!session && inAuthGroup));
  if (!loading && !redirecting) return null;

  return (
    <View style={styles.splash} pointerEvents="auto">
      <Logo size={96} />
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  spinner: { marginTop: 12 },
});
