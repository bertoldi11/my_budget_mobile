import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, NetworkError } from '@/api/client';
import { fetchMovements, type MovementListItem, type MovementPageMeta } from '@/api/movements';
import { useAuth } from '@/auth/auth-context';
import { Banner } from '@/components/form/banner';
import { MovementRow } from '@/components/movement-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function errorMessage(cause: unknown, fallback: string) {
  if (cause instanceof ApiError || cause instanceof NetworkError) return cause.message;
  return fallback;
}

/**
 * Listagem paginada das movimentações.
 *
 * A API devolve uma página por vez (`GET /api/movement?page=`) com o total em
 * `meta`; aqui a navegação é por rolagem infinita, somando as páginas. Como a
 * paginação é por offset, uma movimentação cadastrada no meio-tempo desloca as
 * páginas seguintes — por isso a concatenação descarta ids repetidos.
 *
 * A busca acontece no foco da aba, não na montagem: o `NativeTabs` monta as
 * telas de todas as abas de uma vez (`lazyByDefault: false`), e buscar na
 * montagem gastaria uma requisição antes de o usuário abrir a aba e deixaria a
 * lista velha — ela não veria o que fosse cadastrado na aba Nova nesse meio.
 */
export default function MovementsScreen() {
  const theme = useTheme();
  const { token } = useAuth();

  const [movements, setMovements] = useState<MovementListItem[]>([]);
  const [meta, setMeta] = useState<MovementPageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Busca a primeira página e substitui a lista. Base do foco, do puxar para
   * atualizar e do "Tentar de novo". */
  const loadFirstPage = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;

      try {
        const page = await fetchMovements(token, 1, signal);

        setMovements(page.data);
        setMeta(page.meta);
        setError(null);
      } catch (cause) {
        if (cause instanceof Error && cause.name === 'AbortError') return;

        setError(errorMessage(cause, 'Não foi possível carregar as movimentações.'));
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // A cada foco da aba. Na primeira vez o `loading` mostra o indicador; depois a
  // lista fica em tela e só é trocada quando a resposta chega.
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      loadFirstPage(controller.signal);

      // Sair da aba no meio da busca cancela a requisição.
      return () => controller.abort();
    }, [loadFirstPage])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const hasNextPage = meta !== null && meta.page < meta.total_pages;

  const loadMore = useCallback(async () => {
    if (!token || !meta || !hasNextPage || loading || loadingMore || refreshing) return;

    setLoadingMore(true);

    try {
      const page = await fetchMovements(token, meta.page + 1);

      setMovements((current) => {
        const known = new Set(current.map((movement) => movement.id));
        return [...current, ...page.data.filter((movement) => !known.has(movement.id))];
      });
      setMeta(page.meta);
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause, 'Não foi possível carregar mais movimentações.'));
    } finally {
      setLoadingMore(false);
    }
  }, [token, meta, hasNextPage, loading, loadingMore, refreshing]);

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
          <ActivityIndicator
            color={theme.primary}
            accessibilityLabel="Carregando movimentações"
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Sem nada em tela, o erro é a tela inteira; com a lista carregada, ele vira
  // um aviso no rodapé para não esconder o que já está lá.
  if (error && movements.length === 0) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
          <ThemedView style={styles.errorBox}>
            <Banner tone="error" message={error} />
            <Pressable
              onPress={() => {
                setError(null);
                setLoading(true);
                loadFirstPage();
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
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={movements}
          keyExtractor={(movement) => String(movement.id)}
          renderItem={({ item }) => <MovementRow movement={item} />}
          contentContainerStyle={[styles.list, Platform.OS === 'web' && styles.listWeb]}
          ItemSeparatorComponent={() => (
            <ThemedView style={[styles.separator, { backgroundColor: theme.border }]} />
          )}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedText type="subtitle">Movimentações</ThemedText>
              {meta ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {meta.total_count === 1
                    ? '1 movimentação'
                    : `${meta.total_count} movimentações`}
                </ThemedText>
              ) : null}
            </ThemedView>
          }
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText type="smallBold">Nenhuma movimentação cadastrada</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Cadastre uma movimentação na aba Nova para começar a acompanhar seu orçamento.
              </ThemedText>
            </ThemedView>
          }
          ListFooterComponent={
            <ThemedView style={styles.footer}>
              {loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
              {error && movements.length > 0 ? <Banner tone="error" message={error} /> : null}
              {!hasNextPage && movements.length > 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Fim da lista.
                </ThemedText>
              ) : null}
            </ThemedView>
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  errorBox: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    gap: Spacing.three,
  },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  listWeb: {
    paddingTop: Spacing.six,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.half,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  empty: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.one,
  },
  emptyText: {
    maxWidth: MaxContentWidth / 2,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
