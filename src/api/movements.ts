import { request } from '@/api/client';

/** Espelha `MyBudgetWeb.Api.MovementJSON` no servidor. */
export type CategoryOption = {
  id: number;
  name: string;
  section: { id: number; name: string };
};

export type PaymentMethodOption = {
  id: number;
  name: string;
  type: string;
};

export type TypeOption = { value: string; label: string };

/** Opções dos selects do formulário de nova movimentação. */
export type MovementFormOptions = {
  categories: CategoryOption[];
  payment_methods: PaymentMethodOption[];
  types: TypeOption[];
};

export type Movement = {
  id: number;
  /** Em centavos. */
  amount: number;
  description: string;
  counter_party: string;
  type: string;
  /** ISO 8601 (`2026-11-22`). */
  expend_date: string;
  /** Quantas movimentações o cadastro gerou (1 quando não é parcelado). */
  installments: number;
  category_id: number;
  payment_method_id: number;
};

/** O que o formulário envia. O valor vai como texto em reais (ex.: "1.234,56") */
export type NewMovement = {
  category_id: number;
  payment_method_id: number;
  expend_date: string;
  type: string;
  amount_reais: string;
  installments: number;
  description: string;
  counter_party: string;
};

/** GET /api/movement/new — opções dos selects, já no escopo do usuário. */
export async function fetchMovementFormOptions(token: string, signal?: AbortSignal) {
  const { data } = await request<{ data: MovementFormOptions }>('/api/movement/new', {
    token,
    signal,
  });

  return data;
}

/**
 * POST /api/movement — cadastra a movimentação.
 *
 * A conversão de reais para centavos e o parcelamento acontecem no servidor,
 * pelo mesmo caminho do cadastro no web. Erros de validação chegam como
 * `ApiError` com `fieldErrors`.
 */
export async function createMovement(token: string, movement: NewMovement) {
  const { data } = await request<{ data: Movement }>('/api/movement', {
    method: 'POST',
    token,
    body: { movement },
  });

  return data;
}

/** Uma movimentação na listagem: categoria e método já vêm aninhados. */
export type MovementListItem = {
  id: number;
  /** Em centavos. */
  amount: number;
  description: string | null;
  counter_party: string | null;
  type: string;
  /** ISO 8601 (`2026-11-22`). */
  expend_date: string;
  category: CategoryOption;
  payment_method: PaymentMethodOption;
};

export type MovementPageMeta = {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
};

export type MovementPage = {
  data: MovementListItem[];
  meta: MovementPageMeta;
};

/**
 * GET /api/movement — uma página de movimentações, da mais recente para a mais
 * antiga. `per_page` é limitado a 100 pelo servidor.
 */
export async function fetchMovements(
  token: string,
  page: number,
  signal?: AbortSignal
): Promise<MovementPage> {
  return request<MovementPage>(`/api/movement?page=${page}`, { token, signal });
}
