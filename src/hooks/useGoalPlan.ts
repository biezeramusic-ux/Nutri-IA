import { useEffect, useState } from 'react';
import { loadGoalPlan, type GoalPlan } from '../services/goalPlan';
import { useAuth } from './useAuth';

export function useGoalPlan(): GoalPlan | null {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  useEffect(() => {
    let alive = true;
    if (!userId) {
      setPlan(null);
      return;
    }
    void loadGoalPlan(userId).then((p) => alive && setPlan(p));
    return () => {
      alive = false;
    };
  }, [userId]);
  return plan;
}
