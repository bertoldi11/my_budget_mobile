import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Field, controlStyles } from '@/components/form/field';
import { TextField } from '@/components/form/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  dateFromIsoDate,
  isoDateFromDate,
  isoToDisplayDate,
  maskDate,
  toIsoDate,
} from '@/movements/format';

export type DateFieldProps = {
  label: string;
  /** ISO 8601 (`2026-11-22`), ou "" quando ainda não há uma data válida. */
  value: string;
  onChange: (isoDate: string) => void;
  errors?: string[];
  disabled?: boolean;
};

/**
 * Campo de data com o widget nativo de cada plataforma, do `@expo/ui`
 * (incluído no Expo Go no SDK 58):
 *
 * - **iOS**: o `DatePicker` compacto do SwiftUI é o próprio campo e abre o
 *   calendário da Apple ao ser tocado.
 * - **Android**: o campo abre o `DatePickerDialog` do Material 3, que monta
 *   quando aberto e desmonta ao confirmar ou cancelar — é assim que o
 *   componente funciona, não há API imperativa.
 * - **web**: não existe picker nativo (o `@expo/ui` devolve `null` lá), então
 *   fica o campo de texto com máscara dd/mm/aaaa.
 */
export function DateField({ label, value, onChange, errors, disabled }: DateFieldProps) {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);

  // O picker precisa de um `Date`: sem data escolhida ainda, começa em hoje.
  const selected = dateFromIsoDate(value) ?? new Date();

  if (Platform.OS === 'web') {
    return (
      <WebDateField
        label={label}
        value={value}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <Field label={label} errors={errors}>
        <ThemedView style={styles.iosPicker}>
          <DateTimePicker
            value={selected}
            mode="date"
            display="compact"
            disabled={disabled}
            accentColor={theme.primary}
            onValueChange={(_event, date) => onChange(isoDateFromDate(date))}
          />
        </ThemedView>
      </Field>
    );
  }

  return (
    <Field label={label} errors={errors}>
      <Pressable
        onPress={() => setDialogOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: isoToDisplayDate(value) || 'nenhuma data escolhida' }}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [
          controlStyles.control,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: errors?.length ? theme.error : theme.border,
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          },
        ]}>
        <ThemedText themeColor={value ? 'text' : 'textSecondary'}>
          {isoToDisplayDate(value) || 'dd/mm/aaaa'}
        </ThemedText>
      </Pressable>

      {dialogOpen ? (
        // Fora do fluxo: o host do diálogo não deve ocupar espaço no formulário.
        <ThemedView style={styles.dialogHost}>
          <DateTimePicker
            value={selected}
            mode="date"
            presentation="dialog"
            accentColor={theme.primary}
            positiveButton={{ label: 'Escolher' }}
            onValueChange={(_event, date) => {
              setDialogOpen(false);
              onChange(isoDateFromDate(date));
            }}
            onDismiss={() => setDialogOpen(false)}
          />
        </ThemedView>
      ) : null}
    </Field>
  );
}

/** Campo de texto com máscara, usado onde não há picker nativo. */
function WebDateField({ label, value, onChange, errors, disabled }: DateFieldProps) {
  // O texto digitado mora aqui: enquanto a data está incompleta não há ISO para
  // o pai guardar. Como a tela nunca reescreve a data sozinha, não há o que
  // sincronizar de volta.
  const [display, setDisplay] = useState(() => isoToDisplayDate(value));

  return (
    <TextField
      label={label}
      value={display}
      onChangeText={(text) => {
        const masked = maskDate(text);
        setDisplay(masked);
        onChange(toIsoDate(masked) ?? '');
      }}
      placeholder="dd/mm/aaaa"
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={10}
      editable={!disabled}
      errors={errors}
    />
  );
}

const styles = StyleSheet.create({
  iosPicker: {
    // O picker compacto se ajusta ao conteúdo; sem isto ele esticaria.
    alignItems: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: Spacing.half,
  },
  dialogHost: {
    position: 'absolute',
  },
});
