import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Field, controlStyles } from '@/components/form/field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectOption<T> = { value: T; label: string };

export type SelectFieldProps<T> = {
  label: string;
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Texto do gatilho enquanto nada está escolhido. */
  placeholder?: string;
  errors?: string[];
  disabled?: boolean;
  /** Mostra um campo de busca que filtra as opções enquanto se digita. */
  searchable?: boolean;
  searchPlaceholder?: string;
};

/** Para comparar sem diferenciar maiúsculas nem acentos ("alimentacao" acha "Alimentação"). */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Select com a lista de opções numa folha modal.
 *
 * Feito com componentes do React Native em vez de um picker nativo para ter o
 * mesmo comportamento no iOS, no Android e no web, sem dependência extra.
 */
export function SelectField<T extends string | number>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione',
  errors,
  disabled,
  searchable,
  searchPlaceholder = 'Buscar',
}: SelectFieldProps<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value) ?? null;

  const visibleOptions = useMemo(() => {
    const term = normalize(query);
    if (!searchable || term.length === 0) return options;

    // Casa com qualquer parte do rótulo, para "merc" achar "Casa / Mercado".
    return options.filter((option) => normalize(option.label).includes(term));
  }, [options, query, searchable]);

  function show() {
    setQuery('');
    setOpen(true);
  }

  function choose(option: SelectOption<T>) {
    setOpen(false);
    onChange(option.value);
  }

  return (
    <Field label={label} errors={errors}>
      <Pressable
        onPress={show}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        style={({ pressed }) => [
          controlStyles.control,
          styles.trigger,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: errors?.length ? theme.error : theme.border,
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          },
        ]}>
        <ThemedText
          numberOfLines={1}
          themeColor={selected ? 'text' : 'textSecondary'}
          style={styles.triggerText}>
          {selected?.label ?? placeholder}
        </ThemedText>
        <ThemedText themeColor="textSecondary">▾</ThemedText>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="Fechar"
          onPress={() => setOpen(false)}
        />
        <SafeAreaView style={styles.sheetArea} edges={['bottom']}>
          <ThemedView style={[styles.sheet, { borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={styles.sheetTitle}>
              {label}
            </ThemedText>

            {searchable ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="search"
                accessibilityLabel={searchPlaceholder}
                style={[
                  styles.search,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />
            ) : null}

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {visibleOptions.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                  Nada encontrado para “{query.trim()}”.
                </ThemedText>
              ) : null}

              {visibleOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <Pressable
                    key={String(option.value)}
                    onPress={() => choose(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: isSelected
                          ? theme.backgroundSelected
                          : pressed
                            ? theme.backgroundElement
                            : 'transparent',
                      },
                    ]}>
                    <ThemedText>{option.label}</ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </ThemedView>
        </SafeAreaView>
      </Modal>
    </Field>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  triggerText: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#00000066',
  },
  sheetArea: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sheetTitle: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  search: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    minHeight: 44,
  },
  empty: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    minHeight: 48,
    justifyContent: 'center',
  },
});
