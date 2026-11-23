import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, NetworkError, type FieldErrors } from '@/api/client';
import {
  createMovement,
  fetchMovementFormOptions,
  type MovementFormOptions,
} from '@/api/movements';
import { useAuth } from '@/auth/auth-context';
import { Banner } from '@/components/form/banner';
import { DateField } from '@/components/form/date-field';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { maskCurrency, todayAsIsoDate } from '@/movements/format';

/** Mensagem para o usuário a partir dos erros que a camada de API lança. */
function errorMessage(cause: unknown, fallback: string) {
  if (cause instanceof ApiError || cause instanceof NetworkError) return cause.message;
  return fallback;
}

/**
 * Tela inicial do app autenticado: o cadastro de uma nova movimentação.
 *
 * As opções dos selects vêm de `GET /api/movement/new` e o cadastro vai em
 * `POST /api/movement`, o mesmo caminho do formulário do web — inclusive a
 * conversão do valor em reais para centavos e o parcelamento, que ficam no
 * servidor.
 */
export default function NewMovementScreen() {
  const theme = useTheme();
  const { token } = useAuth();

  const [options, setOptions] = useState<MovementFormOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Mudar isto refaz a busca das opções (botão "Tentar de novo").
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  // Em ISO 8601, como a API espera; o campo cuida de exibir dd/mm/aaaa.
  const [expendDate, setExpendDate] = useState(todayAsIsoDate);
  const [type, setType] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [description, setDescription] = useState('');
  const [counterParty, setCounterParty] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        const data = await fetchMovementFormOptions(token, controller.signal);
        if (!active) return;

        setOptions(data);
        // Como no web: o tipo e o método de pagamento já vêm escolhidos, a
        // categoria começa vazia para o usuário escolher.
        setType((current) => current ?? data.types[0]?.value ?? null);
        setPaymentMethodId((current) => current ?? data.payment_methods[0]?.id ?? null);
      } catch (cause) {
        if (cause instanceof Error && cause.name === 'AbortError') return;
        if (!active) return;

        setLoadError(errorMessage(cause, 'Não foi possível carregar o formulário.'));
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, loadAttempt]);

  const categoryOptions = useMemo(
    () =>
      (options?.categories ?? []).map((category) => ({
        value: category.id,
        label: `${category.section.name} / ${category.name}`,
      })),
    [options]
  );

  const paymentMethodOptions = useMemo(
    () =>
      (options?.payment_methods ?? []).map((paymentMethod) => ({
        value: paymentMethod.id,
        label: paymentMethod.name,
      })),
    [options]
  );

  const handleSubmit = useCallback(async () => {
    if (!token || submitting) return;

    setSuccess(null);
    setFormError(null);

    // Só o que a API não consegue receber é checado aqui; o resto da validação
    // é a mesma do web e vem do servidor.
    const localErrors: FieldErrors = {};

    if (categoryId === null) localErrors.category_id = ['Selecione uma categoria.'];
    if (paymentMethodId === null) localErrors.payment_method_id = ['Selecione um método.'];
    if (type === null) localErrors.type = ['Selecione um tipo.'];
    if (expendDate === '') localErrors.expend_date = ['Informe uma data no formato dd/mm/aaaa.'];
    if (!/^\d+$/.test(installments)) {
      localErrors.installments = ['Informe o número de parcelas.'];
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setFormError('Verifique os campos informados.');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const movement = await createMovement(token, {
        category_id: categoryId!,
        payment_method_id: paymentMethodId!,
        expend_date: expendDate,
        type: type!,
        amount_reais: amount,
        installments: Number(installments),
        description,
        counter_party: counterParty,
      });

      setSuccess(
        movement.installments > 1
          ? `Movimentação cadastrada em ${movement.installments} parcelas!`
          : 'Movimentação cadastrada com sucesso!'
      );

      // Limpa só o que muda de um lançamento para o outro: categoria, método,
      // data e tipo seguem para o próximo cadastro.
      setAmount('');
      setInstallments('1');
      setDescription('');
      setCounterParty('');
    } catch (cause) {
      setFieldErrors(cause instanceof ApiError ? cause.fieldErrors : {});
      setFormError(errorMessage(cause, 'Não foi possível cadastrar a movimentação.'));
    } finally {
      setSubmitting(false);
    }
  }, [
    token,
    submitting,
    categoryId,
    paymentMethodId,
    expendDate,
    type,
    amount,
    installments,
    description,
    counterParty,
  ]);

  const missingSetup =
    options !== null &&
    (options.categories.length === 0 || options.payment_methods.length === 0);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            // No web a barra de abas flutua no topo; no nativo, embaixo.
            contentContainerStyle={[styles.scroll, Platform.OS === 'web' && styles.scrollWeb]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <ThemedView style={styles.content}>
              <ThemedText type="subtitle">Nova movimentação</ThemedText>

              {loadError ? (
                <ThemedView style={styles.feedback}>
                  <Banner tone="error" message={loadError} />
                  <Pressable
                    onPress={() => {
                      setLoadError(null);
                      setLoadAttempt((attempt) => attempt + 1);
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.button,
                      { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: theme.primaryContent }}>
                      Tentar de novo
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ) : options === null ? (
                <ActivityIndicator
                  color={theme.primary}
                  style={styles.loading}
                  accessibilityLabel="Carregando formulário"
                />
              ) : missingSetup ? (
                <Banner
                  tone="error"
                  message={
                    options.categories.length === 0
                      ? 'Nenhuma categoria ativa. Cadastre uma seção e uma categoria no My Budget antes de lançar movimentações.'
                      : 'Nenhum método de pagamento cadastrado. Cadastre um no My Budget antes de lançar movimentações.'
                  }
                />
              ) : (
                <>
                  <SelectField
                    label="Categoria"
                    placeholder="Selecione uma categoria"
                    options={categoryOptions}
                    value={categoryId}
                    onChange={setCategoryId}
                    errors={fieldErrors.category_id}
                    disabled={submitting}
                    searchable
                    searchPlaceholder="Buscar categoria"
                  />

                  <SelectField
                    label="Pago com"
                    options={paymentMethodOptions}
                    value={paymentMethodId}
                    onChange={setPaymentMethodId}
                    errors={fieldErrors.payment_method_id}
                    disabled={submitting}
                  />

                  <DateField
                    label="Data"
                    value={expendDate}
                    onChange={setExpendDate}
                    errors={fieldErrors.expend_date}
                    disabled={submitting}
                  />

                  <SelectField
                    label="Tipo"
                    options={options.types}
                    value={type}
                    onChange={setType}
                    errors={fieldErrors.type}
                    disabled={submitting}
                  />

                  <TextField
                    label="Valor total (R$)"
                    value={amount}
                    onChangeText={(value) => setAmount(maskCurrency(value))}
                    placeholder="0,00"
                    keyboardType="number-pad"
                    inputMode="numeric"
                    editable={!submitting}
                    errors={fieldErrors.amount_reais ?? fieldErrors.amount}
                  />

                  <TextField
                    label="Parcelas"
                    value={installments}
                    onChangeText={(value) => setInstallments(value.replace(/\D/g, ''))}
                    placeholder="1"
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={3}
                    editable={!submitting}
                    errors={fieldErrors.installments}
                  />

                  <TextField
                    label="Descrição"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Mercado do mês"
                    editable={!submitting}
                    errors={fieldErrors.description}
                  />

                  <TextField
                    label="Pago a/Recebido de"
                    value={counterParty}
                    onChangeText={setCounterParty}
                    placeholder="Supermercado"
                    editable={!submitting}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    errors={fieldErrors.counter_party}
                  />

                  <ThemedView style={styles.feedback}>
                    {success ? <Banner tone="success" message={success} /> : null}
                    {formError ? <Banner tone="error" message={formError} /> : null}

                    <Pressable
                      onPress={handleSubmit}
                      disabled={submitting}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: submitting, busy: submitting }}
                      style={({ pressed }) => [
                        styles.button,
                        {
                          backgroundColor: theme.primary,
                          opacity: submitting ? 0.5 : pressed ? 0.8 : 1,
                        },
                      ]}>
                      {submitting ? (
                        <ActivityIndicator color={theme.primaryContent} />
                      ) : (
                        <ThemedText type="smallBold" style={{ color: theme.primaryContent }}>
                          Salvar
                        </ThemedText>
                      )}
                    </Pressable>
                  </ThemedView>
                </>
              )}
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  scrollWeb: {
    paddingTop: Spacing.six,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  loading: {
    marginTop: Spacing.five,
  },
  feedback: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
