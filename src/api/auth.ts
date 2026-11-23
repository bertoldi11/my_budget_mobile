import { request } from '@/api/client';

/** Espelha `MyBudgetWeb.Api.UserJSON.data/1` no servidor. */
export type User = {
  id: number;
  email: string;
  confirmed: boolean;
  budget_enabled: boolean;
};

type LogInResponse = { data: { token: string; user: User } };
type MeResponse = { data: User };

/** POST /api/users/log-in — troca e-mail e senha por um token de API. */
export async function logIn(email: string, password: string) {
  const { data } = await request<LogInResponse>('/api/users/log-in', {
    method: 'POST',
    body: { user: { email, password } },
  });

  return data;
}

/** GET /api/users/me — valida um token guardado e devolve o usuário dele. */
export async function fetchMe(token: string, signal?: AbortSignal) {
  const { data } = await request<MeResponse>('/api/users/me', { token, signal });

  return data;
}

/** DELETE /api/users/log-out — revoga apenas o token enviado. */
export async function logOut(token: string) {
  await request<void>('/api/users/log-out', { method: 'DELETE', token });
}
