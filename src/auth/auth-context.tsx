import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError, NetworkError } from '@/api/client';
import { fetchMe, logIn as apiLogIn, logOut as apiLogOut, type User } from '@/api/auth';
import { tokenStorage } from '@/auth/token-storage';

type AuthState = {
  /** `true` enquanto o token guardado está sendo lido e validado na inicialização. */
  loading: boolean;
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Na inicialização, recupera o token e confirma com o servidor que ainda vale.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        const stored = await tokenStorage.get();
        if (!stored) return;

        try {
          const me = await fetchMe(stored, controller.signal);
          if (!active) return;
          setToken(stored);
          setUser(me);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;

          // Token revogado ou expirado: descarta e volta para o login.
          if (error instanceof ApiError && error.status === 401) {
            await tokenStorage.clear();
            return;
          }

          // Servidor fora do ar: mantém o token guardado e segue deslogado,
          // para não forçar o usuário a digitar a senha de novo por isso.
          if (!(error instanceof NetworkError)) throw error;
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token: newToken, user: newUser } = await apiLogIn(email, password);
    await tokenStorage.set(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    const current = token;

    // Limpa local primeiro: a sessão tem de acabar mesmo se a rede falhar.
    setToken(null);
    setUser(null);
    await tokenStorage.clear();

    if (current) {
      try {
        await apiLogOut(current);
      } catch {
        // Token já inválido ou sem rede; ele expira sozinho no servidor.
      }
    }
  }, [token]);

  const value = useMemo(
    () => ({ loading, user, token, signIn, signOut }),
    [loading, user, token, signIn, signOut]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
