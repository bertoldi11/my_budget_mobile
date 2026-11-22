import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BannerProps = {
  tone: 'success' | 'error';
  message: string;
};

/** Aviso de resultado de uma ação, no lugar do flash do web. */
export function Banner({ tone, message }: BannerProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.banner, { backgroundColor: theme[tone] }]} accessibilityRole="alert">
      <ThemedText type="small" style={{ color: theme[`${tone}Content`] }}>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
