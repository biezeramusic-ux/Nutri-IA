import 'expo-router/entry';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// Widget do ecrã inicial (Android). Não existe no Expo Go: só na app instalada (APK).
if (Platform.OS === 'android' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./src/widgets/widget-task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // Sem módulo nativo (ex.: ainda não foi feito o build com o widget): ignora.
  }
}
