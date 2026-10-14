import type { ReactElement } from 'react';
import { CaloriesWidget } from './CaloriesWidget';
import { NutritionWidget } from './NutritionWidget';
import { WaterWidget } from './WaterWidget';
import type { WidgetSnapshot } from './widgetData';

type Render = (p: { snapshot: WidgetSnapshot | null; width: number; dark?: boolean }) => ReactElement;

export const WIDGET_RENDERERS: Record<string, Render> = {
  NutritionWidget: (p) => <NutritionWidget {...p} />,
  CaloriesWidget: (p) => <CaloriesWidget {...p} />,
  WaterWidget: (p) => <WaterWidget {...p} />,
};
