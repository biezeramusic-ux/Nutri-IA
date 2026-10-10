import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthGate } from '../components/AuthGate';
import { ReferralRedeemer } from '../components/ReferralRedeemer';
import { RemindersSync } from '../components/RemindersSync';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { AuthProvider } from '../hooks/useAuth';
import { DiaryProvider } from '../hooks/useDiary';
import { ProfileProvider } from '../hooks/useProfile';
import { SubscriptionProvider } from '../hooks/useSubscription';
import { WaterProvider } from '../hooks/useWater';

function ThemedApp() {
  const { colors, isDark } = useTheme();
  return (
    <AuthProvider>
      <ProfileProvider>
        <SubscriptionProvider>
          <DiaryProvider>
            <WaterProvider>
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="auth" options={{ animation: 'fade' }} />
                <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
                <Stack.Screen name="quiz" options={{ presentation: 'modal' }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="details" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="water" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="activity" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="goals" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="favorites" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="dishes" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="invite" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="progress-photos" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              </Stack>
              <RemindersSync />
              <ReferralRedeemer />
              <AuthGate />
            </WaterProvider>
          </DiaryProvider>
        </SubscriptionProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
