import { Tabs } from 'expo-router';
import { BookOpen, ChartColumn, House, User, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Platform, type ColorValue } from 'react-native';
import { useNative } from '../../components/Motion';
import { ScannerFab } from '../../components/ScannerFab';
import { font, shadow } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';

function TabIcon({ Icon, color, focused }: { Icon: LucideIcon; color: ColorValue; focused: boolean }) {
  const s = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(s, { toValue: focused ? 1 : 0, useNativeDriver: useNative, speed: 18, bounciness: 14 }).start();
  }, [focused, s]);
  return (
    <Animated.View style={{ transform: [{ scale: s.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }, { translateY: s.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }}>
      <Icon size={20} color={color} />
    </Animated.View>
  );
}

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
        options={{ title: tr('Início'), tabBarIcon: ({ color, focused }) => <TabIcon Icon={House} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="diary"
        options={{ title: tr('Diário'), tabBarIcon: ({ color, focused }) => <TabIcon Icon={BookOpen} color={color} focused={focused} /> }}
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
        options={{ title: tr('Progresso'), tabBarIcon: ({ color, focused }) => <TabIcon Icon={ChartColumn} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: tr('Perfil'), tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} /> }}
      />
    </Tabs>
  );
}
