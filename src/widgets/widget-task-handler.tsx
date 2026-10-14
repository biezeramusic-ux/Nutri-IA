import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { isLang, setCurrentLang } from '../i18n';
import { NutritionWidget } from './NutritionWidget';
import { loadWidgetSnapshot } from './widgetData';

/** Chamado pelo Android quando o widget é adicionado, redimensionado ou actualizado (mesmo com a app fechada). */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const lang = await AsyncStorage.getItem('nutria.lang').catch(() => null);
      if (isLang(lang)) setCurrentLang(lang);
      const snapshot = await loadWidgetSnapshot();
      const width = props.widgetInfo.width;
      props.renderWidget({
        light: <NutritionWidget snapshot={snapshot} width={width} />,
        dark: <NutritionWidget snapshot={snapshot} width={width} dark />,
      });
      break;
    }
    default:
      break;
  }
}
