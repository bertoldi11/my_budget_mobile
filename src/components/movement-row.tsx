import { StyleSheet } from 'react-native';

import type { MovementListItem } from '@/api/movements';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatCents, isoToDisplayDate, movementTypeLabel } from '@/movements/format';

/**
 * Uma linha da listagem, com a mesma informação da tela de movimentações do
 * web: categoria em destaque, data/método/contraparte abaixo, e o valor à
 * direita em verde para entrada e vermelho para saída.
 */
export function MovementRow({ movement }: { movement: MovementListItem }) {
  const details = [
    isoToDisplayDate(movement.expend_date),
    movement.payment_method.name,
    movement.counter_party,
  ]
    .filter((part) => part)
    .join(' · ');

  return (
    <ThemedView style={styles.row}>
      <ThemedView style={styles.main}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {movement.category.section.name} / {movement.category.name}
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {details}
        </ThemedText>

        {movement.description ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {movement.description}
          </ThemedText>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.amount}>
        <ThemedText type="smallBold" themeColor={movement.type === 'credit' ? 'success' : 'error'}>
          {formatCents(movement.amount)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {movementTypeLabel(movement.type)}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  main: {
    flex: 1,
    gap: Spacing.half,
  },
  amount: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
});
