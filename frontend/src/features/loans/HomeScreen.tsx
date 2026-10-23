import React, { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LoanResponse } from '@miniledger/shared';
import { loansApi } from '../../api/loansApi';
import { summaryApi } from '../../api/summaryApi';
import { useAuthStore } from '../../store/authStore';
import { SummaryCard } from '../summary/SummaryCard';
import { LoanCard } from './LoanCard';
import { AddLoanSheet } from './AddLoanSheet';
import { LoanDetailModal } from './LoanDetailModal';
import { Chip } from '../../components/ui/Chip';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { MinimalLogo } from '../../components/three-d/MinimalLogo';
import { RepaidConfirmModal } from './RepaidConfirmModal';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';

type FilterType = 'all' | 'pending' | 'overdue' | 'repaid';

export const HomeScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, clearSession } = useAuthStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanResponse | null>(null);
  const [pendingRepayment, setPendingRepayment] = useState<LoanResponse | null>(null);
  const repaymentResolver = useRef<(didRepay: boolean) => void>(() => undefined);

  // Summary Query
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['summary'],
    queryFn: summaryApi.getSummary,
  });

  // Loans List Query
  const {
    data: loans = [],
    isLoading: isLoansLoading,
    isRefetching,
    refetch: refetchLoans,
  } = useQuery({
    queryKey: ['loans', activeFilter],
    queryFn: () => loansApi.list({ filter: activeFilter }),
  });

  // Repay Mutation
  const repayMutation = useMutation({
    mutationFn: (id: string) => loansApi.repay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  // Create Loan Mutation
  const createLoanMutation = useMutation({
    mutationFn: async (data: {
      friendName: string;
      amountPaise: number;
      dueDate: string;
      note?: string;
      receipt?: {
        uri: string;
        mimeType: string;
        fileName: string;
      };
    }) => {
      const newLoan = await loansApi.create({
        friendName: data.friendName,
        amountPaise: data.amountPaise,
        dueDate: data.dueDate,
        note: data.note,
      });

      if (data.receipt) {
        await loansApi.uploadReceipt(
          newLoan.id,
          data.receipt.uri,
          data.receipt.mimeType,
          data.receipt.fileName,
        );
      }

      return newLoan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchSummary(), refetchLoans()]);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    Haptics.selectionAsync();
  };

  const requestRepayment = async (id: string): Promise<boolean> => {
    const loan = loans.find((item) => item.id === id) ?? selectedLoan;
    if (!loan) return false;
    setPendingRepayment(loan);
    return new Promise((resolve) => {
      repaymentResolver.current = resolve;
    });
  };

  const cancelRepayment = () => {
    repaymentResolver.current(false);
    setPendingRepayment(null);
  };

  const confirmRepayment = async () => {
    if (!pendingRepayment) return;
    await repayMutation.mutateAsync(pendingRepayment.id);
    repaymentResolver.current(true);
    setPendingRepayment(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />

      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.name || user?.username || user?.phone || 'Friend'} 👋
          </Text>
          <View style={styles.titleRow}>
            <MinimalLogo size={24} />
            <Text style={styles.appTitle}>MiniLedger</Text>
          </View>
        </View>

        <Pressable
          onPress={() => clearSession()}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Text style={styles.logoutIcon}>↪</Text>
        </Pressable>
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* 3D Tilting Summary Card */}
            <SummaryCard summary={summary} loading={isSummaryLoading} />

            {/* Filter Chips Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterBar}
              style={styles.filterScroll}
            >
              <Chip
                label="All"
                count={summary?.counts.total}
                selected={activeFilter === 'all'}
                onPress={() => handleFilterChange('all')}
              />
              <Chip
                label="Pending"
                count={summary?.counts.pending}
                selected={activeFilter === 'pending'}
                onPress={() => handleFilterChange('pending')}
              />
              <Chip
                label="Overdue"
                count={summary?.counts.overdue}
                badgeColor={colors.danger}
                selected={activeFilter === 'overdue'}
                onPress={() => handleFilterChange('overdue')}
              />
              <Chip
                label="Repaid"
                count={summary?.counts.repaid}
                badgeColor={colors.accent}
                selected={activeFilter === 'repaid'}
                onPress={() => handleFilterChange('repaid')}
              />
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onPress={() => setSelectedLoan(item)}
            onRepay={requestRepayment}
            isRepaying={repayMutation.isPending}
          />
        )}
        ListEmptyComponent={
          isLoansLoading ? (
            <View style={styles.skeletonList}>
              <Skeleton height={110} borderRadius={radius.card} style={styles.skeletonItem} />
              <Skeleton height={110} borderRadius={radius.card} style={styles.skeletonItem} />
              <Skeleton height={110} borderRadius={radius.card} style={styles.skeletonItem} />
            </View>
          ) : (
            <EmptyState onAddPress={() => setIsAddSheetOpen(true)} />
          )
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button (FAB) */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsAddSheetOpen(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          shadows.glowPrimary,
          pressed && { transform: [{ scale: 0.92 }] },
        ]}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </Pressable>

      {/* Add Loan Bottom Sheet */}
      <AddLoanSheet
        visible={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSubmit={async (data) => {
          await createLoanMutation.mutateAsync(data);
        }}
        loading={createLoanMutation.isPending}
      />

      {/* Loan Detail Modal */}
      <LoanDetailModal
        loan={selectedLoan}
        visible={Boolean(selectedLoan)}
        onClose={() => setSelectedLoan(null)}
        onRepay={requestRepayment}
        isRepaying={repayMutation.isPending}
      />

      <RepaidConfirmModal
        visible={Boolean(pendingRepayment)}
        friendName={pendingRepayment?.friendName ?? ''}
        amountPaise={pendingRepayment?.amountPaise ?? 0}
        loading={repayMutation.isPending}
        onCancel={cancelRepayment}
        onConfirm={confirmRepayment}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  greeting: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  appTitle: {
    ...textStyles.h2,
    color: colors.text,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  logoutText: {
    ...textStyles.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  logoutIcon: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  filterScroll: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 90,
  },
  skeletonList: {
    paddingHorizontal: spacing.base,
  },
  skeletonItem: {
    marginBottom: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    lineHeight: 34,
    fontWeight: '300',
  },
});
