import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { formatPaiseToInr } from '../../utils/money';
import { Button } from '../../components/ui/Button';

interface RepaidConfirmModalProps {
  visible: boolean;
  friendName: string;
  amountPaise: number;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const RepaidConfirmModal: React.FC<RepaidConfirmModalProps> = ({
  visible,
  friendName,
  amountPaise,
  loading = false,
  onCancel,
  onConfirm,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>✓</Text>
        </View>
        <Text style={styles.title}>Mark as repaid?</Text>
        <Text style={styles.message}>
          This will close {friendName}'s {formatPaiseToInr(amountPaise)} loan permanently. This action cannot be undone.
        </Text>
        <Button title="Mark as Repaid" variant="accent" onPress={onConfirm} loading={loading} />
        <Button title="Cancel" variant="ghost" onPress={onCancel} disabled={loading} />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 14, 18, 0.42)',
    padding: spacing.base,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
    ...shadows.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 24,
    color: colors.accent,
    fontWeight: '800',
  },
  title: {
    ...textStyles.h2,
    color: colors.text,
  },
  message: {
    ...textStyles.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
