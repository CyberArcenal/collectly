// src/renderer/pages/loans/overdue/hooks/useOverdueLoans.ts

import { useState, useEffect, useCallback, useRef } from "react";
import type { Debt } from "../../../../api/core/debt";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";
import debtsAPI from "../../../../api/core/debt";

export interface OverdueFilter {
  search: string;
  daysOverdue: string; // "all", "30", "60", "90"
}

export interface OverdueLoan extends Debt {
  stats: NonNullable<Debt["stats"]>;
}

export interface OverdueStats {
  total: number;
  totalAmount: number;
  averageDaysOverdue: number;
  totalPenalties: number;
}

interface UseOverdueLoansReturn {
  loans: OverdueLoan[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
  filters: OverdueFilter;
  selectedLoans: number[];
  setSelectedLoans: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<
    React.SetStateAction<{ key: string; direction: "asc" | "desc" }>
  >;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  fetchStats: () => Promise<void>;
  handleFilterChange: (key: keyof OverdueFilter, value: string) => void;
  resetFilters: () => void;
  toggleLoanSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
  stats: OverdueStats | null;
}

const useOverdueLoans = (): UseOverdueLoansReturn => {
  const [loans, setLoans] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [stats, setStats] = useState<OverdueStats | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "dueDate",
    direction: "asc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  });
  const [filters, setFilters] = useState<OverdueFilter>({
    search: "",
    daysOverdue: "all",
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const computeDaysOverdue = (debt: Debt): number => {
    if (debt.stats?.daysOverdue !== undefined) return debt.stats.daysOverdue;
    const dueDate = new Date(debt.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, diff);
  };

  const fetchStats = useCallback(async () => {
    try {
      const [debtsRes, penaltiesRes] = await Promise.all([
        debtsAPI.getStatistics(),
        penaltiesAPI.getStatistics(),
      ]);

      let total = 0;
      let totalAmount = 0;
      let avgDaysOverdue = 0;

      if (debtsRes.status) {
        const data = debtsRes.data || {};
        // Handle both camelCase and snake_case
        total = data.totalOverdue ?? data.total_overdue ?? 0;
        totalAmount =
          data.totalRemainingBalance ?? data.total_remaining_balance ?? 0;
        avgDaysOverdue = data.avgDaysOverdue ?? data.avg_days_overdue ?? 0;
      }

      setStats({
        total,
        totalAmount,
        averageDaysOverdue: avgDaysOverdue,
        totalPenalties: penaltiesRes.status
          ? (penaltiesRes.data.totalPenaltyAmount ??
            penaltiesRes.data.total_penalty_amount ??
            0)
          : 0,
      });
    } catch (err) {
      console.error("Failed to fetch overdue stats:", err);
    }
  }, []);

  const fetchOverdueLoans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Use dedicated getOverdueDebts method
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: sortConfig.key === "daysOverdue" ? "dueDate" : sortConfig.key,
        sortOrder: sortConfig.direction.toUpperCase() as "ASC" | "DESC",
      };

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.daysOverdue !== "all") {
        params.minDaysOverdue = parseInt(filters.daysOverdue);
      }

      const response = await debtsAPI.getOverdueDebts(params);

      if (!response.status) {
        throw new Error(response.message || "Failed to fetch overdue loans");
      }

      // Data is already filtered by the service (status='overdue', remainingAmount>0, dueDate<today)
      const debts = response.data.data || [];
      const pagination = response.data.pagination || {};

      // Map to OverdueLoan (stats already attached by service)
      const withStats: OverdueLoan[] = debts.map((debt) => ({
        ...debt,
        stats: debt.stats || {
          totalPaid: debt.paidAmount,
          totalPenalty: 0,
          remainingBalance: debt.remainingAmount,
          daysOverdue: computeDaysOverdue(debt),
          paymentCount: 0,
          penaltyCount: 0,
          lastPaymentDate: null,
          isFullyPaid: false,
        },
      }));

      setLoans(withStats);
      setPagination({
        page: pagination.page || currentPage,
        totalPages: pagination.pages || 1,
        totalItems: pagination.total || withStats.length,
        pageSize: pagination.limit || pageSize,
      });

      await fetchStats();
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to load overdue loans");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, filters, sortConfig, fetchStats]);

  // Effect to refetch when filters or pagination change
  useEffect(() => {
    fetchOverdueLoans();
  }, [fetchOverdueLoans]);

  // Reset page when filters or sort change (handled inside handlers)
  const handleFilterChange = (key: keyof OverdueFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
  };

  const resetFilters = () => {
    setFilters({ search: "", daysOverdue: "all" });
    setCurrentPage(1);
  };

  const toggleLoanSelection = (id: number) => {
    setSelectedLoans((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedLoans((prev) =>
      prev.length === loans.length ? [] : loans.map((l) => l.id),
    );
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const reload = () => {
    fetchOverdueLoans();
  };

  const setPageSizeHandler = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    loans,
    loading,
    error,
    pagination,
    filters,
    selectedLoans,
    setSelectedLoans,
    sortConfig,
    setSortConfig,
    pageSize,
    setPageSize: setPageSizeHandler,
    currentPage,
    setCurrentPage,
    reload,
    fetchStats,
    handleFilterChange,
    resetFilters,
    toggleLoanSelection,
    toggleSelectAll,
    handleSort,
    stats,
  };
};

export default useOverdueLoans;
