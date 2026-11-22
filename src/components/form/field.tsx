import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type FieldProps = {
  label: string;
  /** Mensagens vindas da validação do servidor ou da checagem local. */
  errors?: string[];
  children: ReactNode;
};

/** Rótulo, campo e mensagens de erro — a moldura comum dos campos do app. */
export function Field({ label, errors, children }: FieldProps) {
  return (
    <ThemedView style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
      {errors?.length ? (
        <ThemedText type="small" themeColor="error" accessibilityRole="alert">
          {errors.join('. ')}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
});

/** Visual compartilhado pelo input de texto e pelo gatilho do select. */
export const controlStyles = StyleSheet.create({
  control: {
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half,
    fontSize: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
});
