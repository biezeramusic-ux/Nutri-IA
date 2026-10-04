import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translateAuthError } from '../services/authErrors';
import { supabase } from '../services/supabase';

export type SignUpOutcome = 'signed_in' | 'confirm_email';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** true enquanto a sessão guardada ainda está a ser carregada. */
  loading: boolean;
  displayName: string;
  signUp: (name: string, email: string, password: string) => Promise<SignUpOutcome>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    // Callback síncrono: evita chamar o Supabase aqui dentro (risco de deadlock).
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (error) throw new Error(translateAuthError(error));
    // Com confirmação de e-mail ativa, um e-mail já registado devolve um utilizador sem identidades.
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('Este e-mail já está registado. Tente iniciar sessão.');
    }
    return data.session ? 'signed_in' : 'confirm_email';
  }, []);

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(translateAuthError(error));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const metaName = user?.user_metadata?.full_name;
    const displayName = typeof metaName === 'string' && metaName ? metaName : (user?.email ?? '');
    return { session, user, loading, displayName, signUp, signIn, signOut };
  }, [session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
