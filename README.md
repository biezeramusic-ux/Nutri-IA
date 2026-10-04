# Nutri AI 🥗

Contador de calorias por foto, feito para Moçambique e utilizadores internacionais.
Expo SDK 57 · Expo Router · React Native · TypeScript estrito.

## Como correr
```bash
npm install
cp .env.example .env   # preencha EXPO_PUBLIC_ANTHROPIC_API_KEY (opcional)
npx expo start
```
Sem chave de API, o scanner devolve o mock "Vegetable Salad" (fallback).

> ⚠️ **Segurança (MVP):** variáveis `EXPO_PUBLIC_*` ficam embutidas na app e podem ser extraídas.
> Antes de publicar, mova a chamada de IA para um backend/proxy.

## Estrutura
- `src/app` — rotas (Expo Router): `(tabs)/index|scanner|tracker`, `details`, `paywall`
- `src/components` — UI (MealCard, FlowerChart, PlanCard, LockOverlay…)
- `src/services` — `foodRecognition` (IA), `imageCompressor` (<300KB), `payments` (stubs), `foodCatalog`, `storage`
- `src/hooks` — `useSubscription` (trial 3 dias / 2 scans por dia), `useDiary`, `useWater`, `useFasting`

## Pendente para produção
- Backend/proxy para a IA e integração real M-Pesa, e-Mola e cartões (hoje simulados).
- Validação do trial e das assinaturas no servidor (hoje só AsyncStorage).
- Fotos reais dos pratos (hoje ícones/placeholders).
