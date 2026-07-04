// src/renderer/layouts/Sidebar/hooks/useSidebarStats.ts
import { useState, useEffect, useCallback } from 'react';
import type { SidebarStats } from '../types';
import dashboardAPI from '../../../api/analytics/analytics';
import debtsAPI from '../../../api/core/debt';

export const useSidebarStats = () => {
  const [stats, setStats] = useState<SidebarStats>({
    totalOutstanding: 0,
    overdueAmount: 0,
    collectionRate: 0,
    activeDebtors: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const dashboardStatsRes = await dashboardAPI.getDashboardStats();
      if (!dashboardStatsRes.status) throw new Error(dashboardStatsRes.message);
      
      const { totalRemainingBalance, totalOverdue, totalPaymentsCollected } =
        dashboardStatsRes.data;
      const totalCollectedAndOutstanding =
        totalPaymentsCollected + totalRemainingBalance;
      const collectionRate =
        totalCollectedAndOutstanding > 0
          ? (totalPaymentsCollected / totalCollectedAndOutstanding) * 100
          : 0;

      const debtsRes = await debtsAPI.getAll({
        limit: 1000,
        includeDeleted: false,
      });

      if (!debtsRes.status) throw new Error(debtsRes.message);
      
      const activeDebtorIds = new Set<number>();
      debtsRes.data.data.forEach((debt) => {
        if (debt.status !== 'paid' && debt.borrower?.id) {
          activeDebtorIds.add(debt.borrower.id);
        }
      });

      setStats({
        totalOutstanding: totalRemainingBalance,
        overdueAmount: totalOverdue,
        collectionRate,
        activeDebtors: activeDebtorIds.size,
      });
    } catch (error) {
      console.error('Failed to fetch sidebar stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    fetchStats();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
};