import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LoanResponse } from '@miniledger/shared';
import { GlowPulse } from '../../components/three-d/GlowPulse';
import { RepaidStamp } from '../../components/three-d/RepaidStamp';
import { Confetti } from '../../components/three-d/Confetti';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { formatPaiseToInr } from '../../utils/money';
import { formatLoanDate } from '../../utils/dates';
import { snappySpring } from '../../theme/motion';

interface LoanCardProps {
  loan: LoanResponse;
  onPress: () => void;
  onRepay: (id: string) => Promise<void>;
  isRepaying?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onPress,
  onRepay,
  isRepaying = false,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const scale = useSharedValue(1);

  const isRepaid = loan.status === 'REPAID';
  const isOverdue = loan.isOverdue;

  const handlePressIn = () => {
    scale.value = withSpring(0.97, snappySpring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, snappySpring);
  };

  const handleRepayPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCelebration(true);
    await onRepay(loan.id);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        isOverdue && styles.overdueCard,
        isRepaid && styles.repaidCard,
        shadows.card,
        animatedStyle,
      ]}
    >
      {/* Overdue pulsing coral glow */}
      {isOverdue ? <GlowPulse color={colors.danger} /> : null}

      {/* Confetti and 3D Stamp when marking as repaid */}
      {showCelebration ? (
        <View style={styles.celebrationLayer} pointerEvents="none">
          <Confetti count={32} />
          <RepaidStamp onComplete={() => setShowCelebration(false)} />
        </View>
      ) : null}

      <View style={styles.content}>
        {/* Top Row: Friend Name & Status Badge */}
        <View style={styles.topRow}>
          <Text style={[styles.friendName, isRepaid && styles.repaidText]} numberOfLines={1}>
            {loan.friendName}
          </Text>

          {isRepaid ? (
            <View style={styles.repaidBadge}>
              <Text style={styles.repaidBadgeText}>✓ Repaid</Text>
            </View>
          ) : isOverdue ? (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>
                ⚠️ Overdue · {loan.daysOverdue}d
              </Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          )}
        </View>

        {/* Middle Row: Big Amount & Due Date */}
        <View style={styles.middleRow}>
          <Text
            style={[
              styles.amount,
              isOverdue && styles.overdueAmount,
              isRepaid && styles.repaidText,
            ]}
          >
            {formatPaiseToInr(loan.amountPaise)}
          </Text>

          <Text style={styles.dueDateText}>
            {formatLoanDate(loan.dueDate, isOverdue, loan.daysOverdue)}
          </Text>
        </View>

        {/* Bottom Row: Optional Note, Receipt Indicator & Repay Button */}
        <View style={styles.bottomRow}>
          <View style={styles.noteSection}>
            {loan.note ? (
              <Text style={styles.noteText} numberOfLines={1}>
                💬 {loan.note}
              </Text>
            ) : null}

            {loan.receiptCount > 0 ? (
              <Text style={styles.receiptIndicator}>📎 {loan.receiptCount} receipt</Text>
            ) : null}
          </View>

          {!isRepaid ? (
            <Pressable
              onPress={handleRepayPress}
              disabled={isRepaying}
              style={({ pressed }) => [
                styles.repayButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={styles.repayButtonText}>
                {isRepaying ? '...' : 'Mark Repaid'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  overdueCard: {
    borderColor: 'rgba(255, 92, 122, 0.4)',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  repaidCard: {
    opacity: 0.75,
    backgroundColor: colors.surfaceElevated,
  },
  content: {
    padding: spacing.base,
  },
  celebrationLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  friendName: {
    ...textStyles.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  amount: {
    ...textStyles.h2,
    color: colors.text,
  },
  overdueAmount: {
    color: colors.danger,
  },
  repaidText: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  dueDateText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  noteSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  noteText: {
    ...textStyles.small,
    color: colors.textDim,
  },
  receiptIndicator: {
    ...textStyles.small,
    color: colors.primaryLight,
    marginTop: 2,
  },
  repayButton: {
    backgroundColor: 'rgba(46, 230, 166, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  repayButtonText: {
    ...textStyles.small,
    color: colors.accent,
    fontWeight: '700',
  },
  overdueBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  overdueBadgeText: {
    ...textStyles.small,
    color: colors.danger,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  pendingBadgeText: {
    ...textStyles.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  repaidBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  repaidBadgeText: {
    ...textStyles.small,
    color: colors.accent,
    fontWeight: '700',
  },
});
