import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { LoanResponse } from '@miniledger/shared';
import { Button } from '../../components/ui/Button';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { formatPaiseToInr } from '../../utils/money';
import { formatLoanDate } from '../../utils/dates';
import { BASE_API_URL } from '../../api/HttpClient';
import { useAuthStore } from '../../store/authStore';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface LoanDetailModalProps {
  loan: LoanResponse | null;
  visible: boolean;
  onClose: () => void;
  onRepay: (id: string) => Promise<boolean>;
  isRepaying?: boolean;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({
  loan,
  visible,
  onClose,
  onRepay,
  isRepaying = false,
}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [receiptFullscreen, setReceiptFullscreen] = useState(false);
  const receiptScale = useSharedValue(1);
  const savedReceiptScale = useSharedValue(1);
  const zoomScrollRef = useRef<ScrollView>(null);
  const lastTouchAt = useRef(0);

  useEffect(() => {
    if (!receiptFullscreen) {
      receiptScale.value = 1;
      savedReceiptScale.value = 1;
    }
  }, [receiptFullscreen, receiptScale, savedReceiptScale]);

  const pinchReceipt = Gesture.Pinch()
    .onUpdate((event) => {
      receiptScale.value = Math.max(1, Math.min(4, savedReceiptScale.value * event.scale));
    })
    .onEnd(() => {
      savedReceiptScale.value = receiptScale.value;
    });

  const receiptAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: receiptScale.value }],
  }));

  const adjustReceiptScale = (amount: number) => {
    const nextScale = Math.max(1, Math.min(4, receiptScale.value + amount));
    receiptScale.value = nextScale;
    savedReceiptScale.value = nextScale;
  };

  const handleZoomScroll = (offsetY: number) => {
    if (Date.now() - lastTouchAt.current < 250) {
      zoomScrollRef.current?.scrollTo({ y: windowHeight, animated: false });
      return;
    }

    const delta = offsetY - windowHeight;
    if (Math.abs(delta) < 1) return;

    adjustReceiptScale(-delta * 0.004);
    zoomScrollRef.current?.scrollTo({ y: windowHeight, animated: false });
  };

  if (!loan) return null;
  const isRepaid = loan.status === 'REPAID';
  const receipt = loan.receipts?.[0];
  const receiptUrl = receipt && accessToken
    ? `${BASE_API_URL}/receipts/${receipt.id}/file?token=${accessToken}`
    : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.friendName}>{loan.friendName}</Text>
            <View
              style={[
                styles.badge,
                isRepaid
                  ? styles.badgeRepaid
                  : loan.isOverdue
                    ? styles.badgeOverdue
                    : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isRepaid
                    ? styles.badgeTextRepaid
                    : loan.isOverdue
                      ? styles.badgeTextOverdue
                      : styles.badgeTextPending,
                ]}
              >
                {isRepaid
                  ? '✓ Repaid'
                  : loan.isOverdue
                    ? `Overdue (${loan.daysOverdue}d)`
                    : 'Pending'}
              </Text>
            </View>
          </View>

          {/* Amount */}
          <Text
            style={[
              styles.amount,
              loan.isOverdue && !isRepaid && styles.amountOverdue,
            ]}
          >
            {formatPaiseToInr(loan.amountPaise)}
          </Text>

          {/* Timeline Details */}
          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>
                {formatLoanDate(loan.dueDate, loan.isOverdue, loan.daysOverdue)} ({loan.dueDate})
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created On</Text>
              <Text style={styles.detailValue}>
                {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {loan.repaidAt ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Repaid On</Text>
                <Text style={[styles.detailValue, { color: colors.accent }]}>
                  {new Date(loan.repaidAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            ) : null}

            {loan.note ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Note</Text>
                <Text style={styles.detailValue}>{loan.note}</Text>
              </View>
            ) : null}
          </View>

          {/* Receipt Preview */}
          {receiptUrl ? (
            <View style={styles.receiptSection}>
              <Pressable onPress={() => setReceiptFullscreen(true)}>
                <Image source={{ uri: receiptUrl }} style={styles.receiptImage} resizeMode="cover" />
                <View style={styles.fullscreenBadge}><Text style={styles.fullscreenIcon}>↗</Text></View>
              </Pressable>
            </View>
          ) : null}

          {/* Action buttons */}
          {!isRepaid ? (
            <Button
              title="Mark as Repaid"
              variant="accent"
              onPress={async () => {
                const didRepay = await onRepay(loan.id);
                if (didRepay) onClose();
              }}
              loading={isRepaying}
              style={styles.repayBtn}
            />
          ) : null}

          <Button
            title="Close"
            variant="ghost"
            onPress={onClose}
            style={styles.closeBtn}
          />
        </View>
      </View>

      {receiptUrl ? (
        <Modal visible={receiptFullscreen} transparent animationType="fade" onRequestClose={() => setReceiptFullscreen(false)}>
          <GestureHandlerRootView style={styles.receiptOverlay}>
            <Pressable style={styles.receiptBackdrop} onPress={() => setReceiptFullscreen(false)} />
            <ScrollView
              ref={zoomScrollRef}
              style={styles.zoomScroll}
              contentContainerStyle={{ height: windowHeight * 3, justifyContent: 'center' }}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onTouchStart={() => {
                lastTouchAt.current = Date.now();
              }}
              onScroll={(event) => handleZoomScroll(event.nativeEvent.contentOffset.y)}
              onContentSizeChange={() => {
                zoomScrollRef.current?.scrollTo({ y: windowHeight, animated: false });
              }}
            >
              <GestureDetector gesture={pinchReceipt}>
                <Animated.Image
                  source={{ uri: receiptUrl, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined }}
                  style={[
                    styles.fullscreenImage,
                    { width: windowWidth, height: windowHeight * 0.78 },
                    receiptAnimatedStyle,
                  ]}
                  resizeMode="contain"
                />
              </GestureDetector>
            </ScrollView>
            <Pressable style={styles.receiptClose} onPress={() => setReceiptFullscreen(false)}>
              <Text style={styles.receiptCloseText}>×</Text>
            </Pressable>
          </GestureHandlerRootView>
        </Modal>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: spacing.base,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  friendName: {
    ...textStyles.h2,
    color: colors.text,
  },
  amount: {
    ...textStyles.hero,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  amountOverdue: {
    color: colors.danger,
  },
  detailBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: radius.md,
    padding: spacing.base,
    marginVertical: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  detailValue: {
    ...textStyles.caption,
    color: colors.text,
    fontWeight: '600',
  },
  receiptSection: {
    marginBottom: spacing.base,
  },
  receiptImage: {
    width: '100%',
    height: 150,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  fullscreenBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenIcon: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  receiptBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  zoomScroll: {
    ...StyleSheet.absoluteFillObject,
  },
  fullscreenImage: {
    alignSelf: 'center',
  },
  receiptClose: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
  },
  receiptCloseText: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '200',
  },
  repayBtn: {
    marginTop: spacing.sm,
  },
  closeBtn: {
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgePending: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  badgeOverdue: {
    backgroundColor: 'rgba(255, 59, 48, 0.10)',
  },
  badgeRepaid: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  badgeText: {
    ...textStyles.small,
    fontWeight: '700',
  },
  badgeTextPending: {
    color: colors.textMuted,
  },
  badgeTextOverdue: {
    color: colors.danger,
  },
  badgeTextRepaid: {
    color: colors.accent,
  },
});
