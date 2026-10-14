import { useEffect } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { useDiary } from '../hooks/useDiary';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { todayKey } from '../services/date';
import { mealsOfDay, sumMeals } from '../services/dayUtils';
import { WIDGET_NAME, saveWidgetSnapshot, type WidgetSnapshot } from '../widgets/widgetData';

const widgetsSupported = Platform.OS === 'android' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/** Mantém o widget do ecrã inicial actualizado: guarda o estado do dia e pede ao Android para o redesenhar. Não desenha nada. */
export function WidgetSync() {
  const { meals } = useDiary();
  const { goals, onboardingDone } = useWidgetInputs();
  const { lang } = useTheme();

  const totals = sumMeals(mealsOfDay(meals, todayKey()));
  const kcal = Math.round(totals.kcal);
  const protein = Math.round(totals.protein);
  const carbs = Math.round(totals.carbs);
  const fats = Math.round(totals.fats);

  useEffect(() => {
    if (!widgetsSupported || !onboardingDone) return;
    const snapshot: WidgetSnapshot = {
      day: todayKey(),
      goalKcal: goals.calories,
      goalProteinG: goals.proteinG,
      goalCarbsG: goals.carbsG,
      goalFatsG: goals.fatsG,
      kcal,
      proteinG: protein,
      carbsG: carbs,
      fatsG: fats,
    };
    const timer = setTimeout(() => {
      void (async () => {
        try {
          await saveWidgetSnapshot(snapshot);
          // Só carrega o módulo do widget aqui (na app instalada); no Expo Go ele não existe.
          const { requestWidgetUpdate } = await import('react-native-android-widget');
          const { NutritionWidget } = await import('../widgets/NutritionWidget');
          await requestWidgetUpdate({
            widgetName: WIDGET_NAME,
            renderWidget: ({ width }) => ({
              light: <NutritionWidget snapshot={snapshot} width={width} />,
              dark: <NutritionWidget snapshot={snapshot} width={width} dark />,
            }),
          });
        } catch {
          // Sem widget no ecrã inicial ou sem módulo nativo: não faz mal.
        }
      })();
    }, 600);
    return () => clearTimeout(timer);
  }, [onboardingDone, goals.calories, goals.proteinG, goals.carbsG, goals.fatsG, kcal, protein, carbs, fats, lang]);

  return null;
}

function useWidgetInputs() {
  const { goals, profile } = useProfile();
  return { goals, onboardingDone: profile?.onboardingCompleted ?? false };
}
