import { Tabs } from 'expo-router';
import { BookOpen, ChartColumn, House, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { ScannerFab } from '../../components/ScannerFab';
import { font, shadow } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: font.tiny - 1, fontWeight: '600', marginBottom: 0 },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 22 : 12,
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
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
        options={{ title: tr('Início'), tabBarIcon: ({ color }) => <House size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="diary"
        options={{ title: tr('Diário'), tabBarIcon: ({ color }) => <BookOpen size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: tr('Scanner'),
          tabBarLabel: () => null,
          tabBarStyle: { display: 'none' },
          tabBarButton: (props) => (
            <ScannerFab onPress={props.onPress as never} accessibilityState={props.accessibilityState} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: tr('Progresso'), tabBarIcon: ({ color }) => <ChartColumn size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: tr('Perfil'), tabBarIcon: ({ color }) => <User size={20} color={color} /> }}
      />
    </Tabs>
  );
}
