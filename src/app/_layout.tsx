import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { DiaryProvider } from '../hooks/useDiary';
import { SubscriptionProvider } from '../hooks/useSubscription';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SubscriptionProvider>
        <DiaryProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="details" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack>
        </DiaryProvider>
      </SubscriptionProvider>
    </SafeAreaProvider>
  );
}
