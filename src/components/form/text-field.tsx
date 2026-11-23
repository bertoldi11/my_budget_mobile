import { TextInput, type TextInputProps } from 'react-native';

import { Field, controlStyles } from '@/components/form/field';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  errors?: string[];
};

export function TextField({ label, errors, ...inputProps }: TextFieldProps) {
  const theme = useTheme();

  return (
    <Field label={label} errors={errors}>
      <TextInput
        style={[
          controlStyles.control,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: errors?.length ? theme.error : theme.border,
            color: theme.text,
          },
        ]}
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={label}
        {...inputProps}
      />
    </Field>
  );
}
