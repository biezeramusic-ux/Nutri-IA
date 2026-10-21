import { Tabs } from 'expo-router';
import { BookOpen, ChartColumn, House, User, type LucideIcon } from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { ScannerFab } from '../../components/ScannerFab';
import { font, shadow } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';

/** Ícone da aba: o ativo ganha uma "pílula" suave por trás e traço mais forte. */
function TabIcon({ Icon, color, focused, bg }: { Icon: LucideIcon; color: import('react-native').ColorValue; focused: boolean; bg: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: focused ? bg : 'transparent' }}>
      <Icon size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        // Abas já montadas (toque imediato) e as que ficam em segundo plano não re-desenham.
        lazy: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: font.tiny - 1, fontWeight: '700', marginTop: -2 },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 22 : 12,
          height: 74,
          paddingTop: 8,
          paddingBottom: 9,
          borderRadius: 28,
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
        options={{ title: tr('Início'), tabBarIcon: ({ color, focused }) => <TabIcon Icon={House} color={color} focused={focused} bg={colors.primarySoft} /> }}
      />
      <Tabs.Screen
        name="diary"
        options={{ title: tr('Diário'), tabBarIcon: ({ color, focused }) => <TabIcon Icon={BookOpen} color={color} focused={focused} bg={colors.primarySoft} /> }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: tr('Scanner'),
          tabBarLabel: () => null,
          lazy: true,
          tabBarStyle: { display: 'none' },
          tabBarButton: (props) => (
            <ScannerFab onPress={props.onPress as never} accessibilityState={props.accessibilityState} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: tr('Estatísticas'), tabBarLabelStyle: { fontSize: 9, fontWeight: '700', marginTop: -2 }, tabBarIcon: ({ color, focused }) => <TabIcon Icon={ChartColumn} color={color} focused={focused} bg={colors.primarySoft} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: tr('Perfil'), tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} bg={colors.primarySoft} /> }}
      />
    </Tabs>
  );
}
