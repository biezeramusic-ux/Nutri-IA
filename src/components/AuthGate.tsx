import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { Logo } from './Logo';

/**
 * Guard do Root Layout: sem sessão, todas as rotas (exceto /auth/*) redirecionam para o login;
 * com sessão, /auth/* redireciona para a Home, ou para o quiz se ainda não foi feito. Enquanto decide, cobre o ecrã com um splash
 * para que conteúdo protegido nunca "pisque".
 */
export function AuthGate() {
  const { session, loading: authLoading } = useAuth();
  const { loading: profileLoading, needsOnboarding } = useProfile();
  const loading = authLoading || (!!session && profileLoading);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const inAuthGroup = segments[0] === 'auth';
  const inOnboarding = segments[0] === 'onboarding';
  const inQuiz = segments[0] === 'quiz';
  const navigatorReady = !!navigationState?.key;

  useEffect(() => {
    if (loading || !navigatorReady) return;
    if (!session && !inAuthGroup) router.replace('/auth/login');
    else if (session && needsOnboarding && !inOnboarding && !inQuiz) router.replace('/onboarding');
    else if (session && !needsOnboarding && (inAuthGroup || inOnboarding)) router.replace('/');
  }, [session, loading, needsOnboarding, inAuthGroup, inOnboarding, inQuiz, navigatorReady, router]);

  const redirecting =
    !loading &&
    ((!session && !inAuthGroup) ||
      (!!session && needsOnboarding && !inOnboarding && !inQuiz) ||
      (!!session && !needsOnboarding && (inAuthGroup || inOnboarding)));
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
