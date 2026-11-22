import { API_URL } from '@/api/config';

/** Erros de validação por campo: `{ amount_reais: ['valor inválido'] }`. */
export type FieldErrors = Record<string, string[]>;

/** Erro de uma resposta da API, com o status para quem precisar diferenciar. */
export class ApiError extends Error {
  readonly status: number;
  /** Erros por campo (`errors.fields` na resposta); vazio quando não houver. */
  readonly fieldErrors: FieldErrors;

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Falha de rede: não houve resposta do servidor. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Não foi possível conectar ao servidor. Verifique sua conexão.');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Token de API; enviado como `Authorization: Bearer`. */
  token?: string | null;
  signal?: AbortSignal;
};

/** O `errors` da resposta, quando vem no formato do Phoenix. */
function extractErrors(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const errors = (payload as { errors?: unknown }).errors;
  if (!errors || typeof errors !== 'object') return null;
  return errors as Record<string, unknown>;
}

/** Formato de erro do Phoenix: `%{errors: %{detail: "..."}}`. */
function extractMessage(payload: unknown, status: number): string {
  const detail = extractErrors(payload)?.detail;
  if (typeof detail === 'string') return detail;
  return `Erro inesperado do servidor (HTTP ${status}).`;
}

/**
 * Erros de validação por campo, de `%{errors: %{fields: %{campo => [msg]}}}`
 * (ver `MyBudgetWeb.Api.ChangesetJSON` no ../my_budget). Campos com formato
 * inesperado são ignorados: a mensagem de `detail` já cobre o usuário.
 */
function extractFieldErrors(payload: unknown): FieldErrors {
  const fields = extractErrors(payload)?.fields;
  if (!fields || typeof fields !== 'object') return {};

  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(fields as Record<string, unknown>)) {
    const list = (Array.isArray(messages) ? messages : [messages]).filter(
      (message): message is string => typeof message === 'string'
    );
    if (list.length > 0) result[field] = list;
  }
  return result;
}

/**
 * Faz uma requisição à API e devolve o corpo já parseado.
 *
 * Lança `ApiError` para respostas de erro e `NetworkError` quando a requisição
 * nem chega ao servidor. Respostas 204 devolvem `undefined`.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    // Repassa o cancelamento: não é falha de rede.
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    throw new NetworkError(cause);
  }

  if (response.status === 204) {
    if (!response.ok) throw new ApiError(response.status, 'Erro inesperado do servidor.');
    return undefined as T;
  }

  // Um proxy ou erro de rota pode devolver HTML; não assuma JSON.
  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(payload, response.status),
      extractFieldErrors(payload)
    );
  }

  return payload as T;
}
