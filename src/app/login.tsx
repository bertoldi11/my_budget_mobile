import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      // Não troca de tela aqui: o guard do _layout reage ao estado de auth.
    } catch (cause) {
      // ApiError e NetworkError já vêm com mensagem para o usuário.
      setError(
        cause instanceof ApiError || (cause instanceof Error && cause.name === 'NetworkError')
          ? cause.message
          : 'Não foi possível entrar. Tente novamente.'
      );
      setSubmitting(false);
    }
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
      color: theme.text,
    },
  ];

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled">
            <ThemedView style={styles.form}>
              <ThemedText type="subtitle">Entrar</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.lead}>
                Use o mesmo e-mail e senha da sua conta do My Budget.
              </ThemedText>

              <ThemedText type="smallBold" style={styles.label}>
                E-mail
              </ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={inputStyle}
                placeholder="voce@exemplo.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!submitting}
                returnKeyType="next"
                accessibilityLabel="E-mail"
              />

              <ThemedText type="smallBold" style={styles.label}>
                Senha
              </ThemedText>
              <ThemedView style={styles.passwordWrapper}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={[inputStyle, styles.passwordInput]}
                  placeholder="sua senha"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  autoCorrect={false}
                  secureTextEntry={!passwordVisible}
                  textContentType="password"
                  editable={!submitting}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  accessibilityLabel="Senha"
                />

                <Pressable
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  accessibilityState={{ selected: passwordVisible }}
                  hitSlop={Spacing.two}
                  style={({ pressed }) => [styles.passwordToggle, pressed && styles.pressed]}>
                  {/*
                    O ícone mostra a ação, não o estado: olho quando a senha
                    está escondida, olho cortado quando está visível. iOS usa
                    SF Symbols e Android/web, Material Symbols; o `fallback`
                    cobre a plataforma que não tiver o símbolo.
                  */}
                  <SymbolView
                    name={
                      passwordVisible
                        ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                        : { ios: 'eye', android: 'visibility', web: 'visibility' }
                    }
                    size={20}
                    tintColor={theme.primary}
                    fallback={
                      <ThemedText type="smallBold" themeColor="primary">
                        {passwordVisible ? 'Ocultar' : 'Mostrar'}
                      </ThemedText>
                    }
                  />
                </Pressable>
              </ThemedView>

              {error ? (
                <ThemedView
                  style={[styles.errorBox, { backgroundColor: theme.error }]}
                  accessibilityRole="alert">
                  <ThemedText type="small" style={{ color: theme.errorContent }}>
                    {error}
                  </ThemedText>
                </ThemedView>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit, busy: submitting }}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: theme.primary,
                    opacity: !canSubmit ? 0.5 : pressed ? 0.8 : 1,
                  },
                ]}>
                {submitting ? (
                  <ActivityIndicator color={theme.primaryContent} />
                ) : (
                  <ThemedText type="smallBold" style={{ color: theme.primaryContent }}>
                    Entrar
                  </ThemedText>
                )}
              </Pressable>
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
    justifyContent: 'center',
    padding: Spacing.four,
  },
  form: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    alignSelf: 'center',
    gap: Spacing.two,
  },
  lead: {
    marginBottom: Spacing.three,
  },
  label: {
    marginTop: Spacing.two,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half,
    fontSize: 16,
  },
  passwordWrapper: {
    justifyContent: 'center',
  },
  passwordInput: {
    // Espaço para o botão, que fica sobre a ponta direita do campo.
    paddingRight: Spacing.six,
  },
  passwordToggle: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  errorBox: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  button: {
    marginTop: Spacing.four,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
