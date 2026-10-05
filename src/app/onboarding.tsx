import { QuizFlow } from '../components/quiz/QuizFlow';

/** Primeiro quiz (obrigatório depois de criar conta). */
export default function OnboardingScreen() {
  return <QuizFlow mode="first" />;
}
