import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { Button } from './Button';

interface EmptyStateProps {
  onAddPress: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🐷</Text>
      <Text style={styles.title}>No loans recorded yet</Text>
      <Text style={styles.subtitle}>
        Lent some money to a friend? Tap the button below to record it and keep track easily.
      </Text>
      <Button
        title="＋ Add First Loan"
        onPress={onAddPress}
        style={styles.addBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xl,
  },
  icon: {
    fontSize: 54,
    marginBottom: spacing.base,
  },
  title: {
    ...textStyles.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  addBtn: {
    minWidth: 180,
  },
});
