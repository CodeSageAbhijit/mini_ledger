import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SummaryResponse } from '@miniledger/shared';
import { TiltCard } from '../../components/three-d/TiltCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { colors, radius, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { formatPaiseToInr } from '../../utils/money';

interface SummaryCardProps {
  summary?: SummaryResponse;
  loading?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, loading = false }) => {
  const { width } = useWindowDimensions();
  if (loading || !summary) {
    return (
      <View style={styles.skeletonContainer}>
        <Skeleton height={200} borderRadius={radius.card} />
      </View>
    );
  }

  const { totalLentPaise, totalRepaidPaise, outstandingPaise, overduePaise, counts } = summary;

  // Percentage calculations for visual ring / bar
  const safeTotal = totalLentPaise > 0 ? totalLentPaise : 1;
  const repaidPct = Math.round((totalRepaidPaise / safeTotal) * 100);
  const overduePct = Math.round((overduePaise / safeTotal) * 100);

  return (
    <TiltCard style={styles.card} maxTiltDeg={8}>
      <View style={[styles.content, width < 360 && styles.compactContent]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.label}>NET OUTSTANDING</Text>
          <View style={styles.countsBadge}>
            <Text style={styles.countsText}>
              {counts.pending} pending · {counts.overdue} overdue
            </Text>
          </View>
        </View>

        {/* Big Outstanding Amount */}
        <Text style={styles.outstandingAmount}>
          {formatPaiseToInr(outstandingPaise)}
        </Text>

        {/* Visual Progress Bar */}
        <View style={styles.barTrack}>
          <View style={[styles.barFillRepaid, { width: `${repaidPct}%` }]} />
          <View style={[styles.barFillOverdue, { width: `${overduePct}%` }]} />
        </View>

        {/* Bottom Three Metrics */}
        <View style={[styles.metricsRow, width < 360 && styles.compactMetricsRow]}>
          <View style={[styles.metricItem, width < 360 && styles.compactMetricItem]}>
            <View style={styles.dotLent} />
            <Text style={styles.metricLabel} numberOfLines={1}>Total Lent</Text>
            <Text style={styles.metricValue} numberOfLines={1}>{formatPaiseToInr(totalLentPaise)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.metricItem, width < 360 && styles.compactMetricItem]}>
            <View style={styles.dotRepaid} />
            <Text style={styles.metricLabel} numberOfLines={1}>Repaid ({repaidPct}%)</Text>
            <Text style={[styles.metricValue, { color: colors.accent }]} numberOfLines={1}>
              {formatPaiseToInr(totalRepaidPaise)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.metricItem, width < 360 && styles.compactMetricItem]}>
            <View style={styles.dotOverdue} />
            <Text style={styles.metricLabel} numberOfLines={1}>Overdue</Text>
            <Text
              style={[
                styles.metricValue,
                { color: overduePaise > 0 ? colors.danger : colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {formatPaiseToInr(overduePaise)}
            </Text>
          </View>
        </View>
      </View>
    </TiltCard>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  card: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  content: {
    padding: spacing.xl,
  },
  compactContent: {
    padding: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  countsBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  countsText: {
    ...textStyles.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  outstandingAmount: {
    ...textStyles.hero,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  barFillRepaid: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  barFillOverdue: {
    height: '100%',
    backgroundColor: colors.danger,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  compactMetricsRow: {
    marginHorizontal: -spacing.xs,
  },
  metricItem: {
    flex: 1,
    minWidth: 0,
  },
  compactMetricItem: {
    marginHorizontal: spacing.xs,
  },
  dotLent: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
    marginBottom: 4,
  },
  dotRepaid: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginBottom: 4,
  },
  dotOverdue: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
    marginBottom: 4,
  },
  metricLabel: {
    ...textStyles.small,
    color: colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    ...textStyles.caption,
    color: colors.text,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: spacing.sm,
  },
});
