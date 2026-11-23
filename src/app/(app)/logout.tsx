import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Banner } from '@/components/form/banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Aba "Sair": não é uma tela para ficar, é a ação de encerrar a sessão.
 *
 * O menu nativo exige uma rota por item — não existe botão solto na UITabBar do
 * iOS nem na BottomNavigation do Android, e o `tabPress` do NativeTabs não pode
 * ser cancelado (`canPreventDefault: false`). Então o item do menu é esta rota,
 * que ao receber foco faz o logout: o `signOut` limpa token e usuário, e o
 * `Stack.Protected` do `_layout.tsx` da raiz reage levando para o login. O
 * "Saindo…" aparece só por um instante.
 *
 * A saída roda no foco, nunca na montagem: o `NativeTabs` monta as telas de
 * todas as abas de uma vez (`lazyByDefault: false`), então um `useEffect` aqui
 * deslogaria o usuário no instante em que ele acabasse de entrar.
 */
export default function LogoutScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // `signOut` troca de identidade quando o token zera, o que reexecutaria o
  // efeito ainda com a tela em foco; o ref garante uma saída por tentativa.
  const handledAttempt = useRef(-1);

  useFocusEffect(
    useCallback(() => {
      if (handledAttempt.current === attempt) return;
      handledAttempt.current = attempt;

      (async () => {
        try {
          // Falha de rede já é engolida pelo `signOut`: o token expira sozinho
          // no servidor. Só sobra aqui o erro de escrita no armazenamento local.
          await signOut();
        } catch {
          setError('Não foi possível encerrar a sessão. Tente de novo.');
        }
      })();
    }, [attempt, signOut])
  );

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
        {error ? (
          <ThemedView style={styles.box}>
            <Banner tone="error" message={error} />
            <Pressable
              onPress={() => {
                setError(null);
                setAttempt((current) => current + 1);
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
        ) : (
          <ThemedView style={styles.box}>
            <ActivityIndicator color={theme.primary} accessibilityLabel="Saindo" />
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              Saindo…
            </ThemedText>
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  box: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    gap: Spacing.three,
  },
  label: {
    textAlign: 'center',
  },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
