import { Tabs } from 'expo-router';
import { ChartColumn, Droplets, House, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { ScannerFab } from '../../components/ScannerFab';
import { colors, font, shadow } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: font.tiny - 1, fontWeight: '600', marginBottom: 2 },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 22 : 12,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 22,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadow,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: ({ color }) => <House size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progresso', tabBarIcon: ({ color }) => <ChartColumn size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarLabel: () => null,
          tabBarStyle: { display: 'none' },
          tabBarButton: (props) => (
            <ScannerFab onPress={props.onPress as never} accessibilityState={props.accessibilityState} />
          ),
        }}
      />
      <Tabs.Screen
        name="water"
        options={{ title: 'Água', tabBarIcon: ({ color }) => <Droplets size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={20} color={color} /> }}
      />
    </Tabs>
  );
}
