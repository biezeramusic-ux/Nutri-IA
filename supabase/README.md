# Supabase · setup do Nutri IA

1. Crie um projeto em <https://supabase.com>.
2. **SQL Editor** → cole todo o ficheiro `migrations/001_init.sql` → *Run*. Depois faça o mesmo, por ordem, com `migrations/002_onboarding_goals.sql` (quiz, metas diárias e lembretes de água) e `migrations/003_quiz_habits.sql` (saúde, hábitos, alimentos e confiança da IA) e por fim `migrations/004_free_pro_limits.sql` (plano grátis: 5 registos de refeição no total durante os 3 dias; PRO sem limites; fibras, peso, atividade e passos).
   (Cria tabelas, RLS, trigger do perfil, RPCs `get_access_status` / `consume_scan` / `activate_plan` e o bucket privado `meal-photos`.)
3. **Project Settings → API**: copie *Project URL* e *anon public key* para o `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
   Nunca use a `service_role` key na app.
4. **Authentication → Providers → Email**: para o MVP, desligue *Confirm email* (login imediato após o registo).
   Se deixar ligado, a app mostra "Verifique o seu e-mail" após o registo.
5. Pagamentos simulados (apenas desenvolvimento): para o paywall conseguir ativar planos de teste, execute uma vez
   ```sql
   alter database postgres set app.allow_dev_activation = 'true';
   ```
   Em **produção deixe desligado** (qualquer utilizador autenticado poderia dar-se premium) e ative planos
   por webhook de pagamento com a `service_role`.

## Login com Google
1. **Google Cloud Console** (https://console.cloud.google.com): crie um projeto → *APIs e serviços* → *Ecrã de consentimento OAuth* (tipo Externo, preencha nome da app e e-mail) → *Credenciais* → *Criar credenciais* → *ID de cliente OAuth* → tipo **Aplicação Web**.
2. Em *URIs de redirecionamento autorizados* coloque: `https://<ref-do-projeto>.supabase.co/auth/v1/callback` (o URL exato aparece no Supabase, no painel do provedor Google).
3. Copie o **Client ID** e o **Client Secret**.
4. **Supabase → Authentication → Sign In / Providers → Google**: ative, cole o Client ID e o Client Secret, *Save*.
5. **Supabase → Authentication → URL Configuration → Redirect URLs**: adicione `exp://**` (Expo Go) e `nutriai://**` (app instalada), *Save*.

## Regras de segurança (resumo)
- RLS em todas as tabelas: cada utilizador só vê/escreve as suas linhas.
- `profiles`: o cliente só altera `full_name`; teste grátis e plano não são editáveis pelo cliente.
- `daily_scans`: só escrita via `consume_scan()` (atómica, dia em `Africa/Maputo`, 3 dias de teste, 2 scans/dia).
- Fotos: comprimidas a ~50 KB antes de arquivar; bucket privado, cada utilizador só acede à pasta `<uid>/`.

## IA (Gemini) — Edge Function `ai`
1. Instale o Supabase CLI e faça `supabase login` e `supabase link --project-ref <ref do projeto>`.
2. Guarde a chave: `supabase secrets set GEMINI_API_KEY=<a sua chave>` (opcional: `GEMINI_MODEL=<modelo>`).
3. Publique: `supabase functions deploy ai`.
A app chama a função com a sessão do utilizador; a função valida o plano (`consume_scan`) antes de usar o Gemini.
