/**
 * Máscaras e conversões dos campos do formulário de movimentação.
 *
 * A data circula pelo app em ISO 8601 (`2026-11-22`), que é o formato que a API
 * espera; "dd/mm/aaaa" aparece só na exibição e na digitação (web).
 */

/**
 * Formata o que o usuário digita como valor em reais, considerando os dois
 * últimos dígitos como centavos: "123456" vira "1.234,56".
 */
export function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (digits.length === 0) return '';

  const padded = digits.padStart(3, '0');
  const cents = padded.slice(-2);
  const reais = padded.slice(0, -2).replace(/^0+(?=\d)/, '');

  return `${reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`;
}

/** Formata o que o usuário digita como data: "22112026" vira "22/11/2026". */
export function maskDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * A data de um `Date` em ISO 8601, pelo calendário local.
 *
 * Não dá para usar `toISOString()`: ele converte para UTC e, num fuso negativo
 * como o do Brasil, a meia-noite local cai no dia anterior.
 */
export function isoDateFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/** Hoje em ISO 8601, no fuso do aparelho. */
export function todayAsIsoDate(): string {
  return isoDateFromDate(new Date());
}

/** O `Date` (meia-noite local) de uma data ISO, ou `null` se não for válida. */
export function dateFromIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  // Rejeita datas que não existem no calendário (31/02 viraria 03/03).
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

/** "2026-11-22" para exibição como "22/11/2026"; "" quando não é uma data ISO. */
export function isoToDisplayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/**
 * Converte "22/11/2026" para o ISO 8601 que a API espera ("2026-11-22"), ou
 * `null` quando a data não existe no calendário (31/02, por exemplo).
 */
export function toIsoDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, day, month, year] = match;

  return dateFromIsoDate(`${year}-${month}-${day}`) ? `${year}-${month}-${day}` : null;
}

/** Centavos em reais para exibição: 123456 vira "R$ 1.234,56". */
export function formatCents(cents: number): string {
  const signal = cents < 0 ? '-' : '';

  return `${signal}R$ ${maskCurrency(String(Math.abs(cents)))}`;
}

/** Rótulo do tipo da movimentação, igual ao do web (`MyBudgetWeb.Format`). */
export function movementTypeLabel(type: string): string {
  if (type === 'credit') return 'Entrada';
  if (type === 'debit') return 'Saída';

  return type;
}
