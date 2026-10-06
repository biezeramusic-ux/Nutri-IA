# Nutri IA 🥗

Contador de calorias por foto, feito para Moçambique e utilizadores internacionais.
Expo SDK 57 · Expo Router · React Native · TypeScript estrito.

## Como correr
```bash
npm install
cp .env.example .env   # Supabase (obrigatório) + EXPO_PUBLIC_ANTHROPIC_API_KEY (opcional)
npx expo start
```
Antes de correr, configure o Supabase: veja [`supabase/README.md`](supabase/README.md).
Sem chave de API, o scanner devolve o mock "Vegetable Salad" (fallback).

> ⚠️ **Segurança (MVP):** variáveis `EXPO_PUBLIC_*` ficam embutidas na app e podem ser extraídas.
> Antes de publicar, mova a chamada de IA para um backend/proxy.

## Ver a app no telemóvel
- **Rápido (Expo Go):** instale *Expo Go*, corra `npx expo start` e leia o QR code (telemóvel e PC na mesma rede Wi-Fi, ou use `npx expo start --tunnel`).
- **APK instalável (Android):** `npm i -g eas-cli && eas login && eas build -p android --profile preview`, depois instale o link do APK.
  Defina as variáveis `EXPO_PUBLIC_*` no EAS (`eas env:create`) antes de compilar.

## Design
Interface pensada para telemóvel: escala tipográfica compacta, cartões com borda fina e cantos arredondados,
ícones [Lucide](https://lucide.dev), neutros slate e Verde Saúde (`src/constants/theme.ts`). Todo o texto está em português.

## Quiz, metas e lembretes de água
- Depois de criar conta (ou no primeiro login com Google) a app mostra um quiz de 8 perguntas (objetivo, dados, atividade, saúde, hábitos sim/não, restrições e alimentos do dia a dia) e calcula as metas diárias
  de calorias, macros e água (`src/services/goals.ts`). Pode refazê-lo em Perfil.
- Os lembretes de água são notificações locais planeadas por `src/services/waterReminderPlan.ts`
  (ajustam-se ao progresso, ao objetivo e ao horário). Fundo do "Criar conta": substitua `assets/auth-bg.jpg` pela sua foto.

## Estrutura
- `src/app` — rotas (Expo Router): `auth/login|register`, `onboarding` (quiz), `quiz` (refazer), `(tabs)/index|progress|scanner|water|profile`, `details`, `paywall`
- `src/components` — UI (MealCard, FlowerChart, PlanCard, LockOverlay…)
- `src/services` — `supabase` (cliente), `repositories/` (meals, tracker, access), `foodRecognition` (IA), `imageCompressor` (<300KB), `payments` (stubs), `foodCatalog`
- `src/hooks` — `useAuth`, `useSubscription` (estado vindo do servidor), `useProfile` (metas do quiz), `useDiary`, `useWater` (+ lembretes)

## Pendente para produção
- Backend/proxy para a IA e integração real M-Pesa, e-Mola e cartões (hoje simulados).
- Webhooks de pagamento que ativem o plano no servidor (hoje `activate_plan` é só para DEV).
- Fotos reais dos pratos (hoje ícones/placeholders).
