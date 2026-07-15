// src/renderer/pages/loans/active/hooks/useActiveLoans.ts
import { useState, useEffect, useCallback, useRef } from "react";
import type { Debt } from "../../../../api/core/debt";
import debtsAPI from "../../../../api/core/debt";

export interface ActiveLoanFilters {
  search: string;
  dueDateFrom: string;
  dueDateTo: string;
  minRemainingAmount: number;
}

export interface LoanStats {
  totalActive: number;
  totalAmountOwed: number;
  totalRemainingBalance: number;
  totalOverdue: number;
}

interface UseActiveLoansReturn {
  loans: Debt[];
  loading: boolean;
  error: string | null;
  total: number;
  pagination: { page: number; totalPages: number; totalItems: number; limit: number };
  filters: ActiveLoanFilters;
  selectedLoans: number[];
  setSelectedLoans: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string; direction: "asc" | "desc" }>>;
  limit: number;
  setLimit: (size: number) => void;
  page: number;
  setPage: (page: number) => void;
  reload: () => void;
  fetchStats: () => Promise<void>;
  handleFilterChange: (key: keyof ActiveLoanFilters, value: string | number) => void;
  resetFilters: () => void;
  toggleLoanSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
  stats: LoanStats | null;
}

const DEFAULT_LOANS: Debt[] = [];

const useActiveLoans = (): UseActiveLoansReturn => {
  const [loans, setLoans] = useState<Debt[]>(DEFAULT_LOANS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "dueDate", direction: "asc" });
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState<ActiveLoanFilters>({
    search: "",
    dueDateFrom: "",
    dueDateTo: "",
    minRemainingAmount: 0,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await debtsAPI.getStatistics();
      if (response.status) {
        const data = response.data;
        setStats({
          totalActive: data.totalActive || data.total_active || 0,
          totalAmountOwed: data.totalAmountOwed || data.total_amount_owed || 0,
          totalRemainingBalance: data.totalRemainingBalance || data.total_remaining_balance || 0,
          totalOverdue: data.totalOverdue || data.total_overdue || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch loan stats:", err);
    }
  }, []);

  const fetchActiveLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtsAPI.getAll({
        status: "active",
        includeDeleted: false,
        page,
        limit,
        search: filters.search || undefined,
        sortBy: sortConfig.key === "borrower" ? "borrowerName" : sortConfig.key,
        sortOrder: sortConfig.direction.toUpperCase() as "ASC" | "DESC",
        dueDateFrom: filters.dueDateFrom || undefined,
        dueDateTo: filters.dueDateTo || undefined,
      });
      if (!response.status) {
        throw new Error(response.message || "Failed to fetch active loans");
      }
      if (mountedRef.current) {
        let data = response.data.data || [];
        if (filters.minRemainingAmount > 0) {
          data = data.filter((loan) => (loan.remainingAmount ?? 0) >= filters.minRemainingAmount);
        }
        setLoans(data);
        setPaginationMeta({
          page: response.data.pagination?.page ?? 1,
          totalPages: response.data.pagination?.pages ?? 1,
          totalItems: response.data.pagination?.total ?? data.length,
          limit: response.data.pagination?.limit ?? limit,
        });
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to load active loans");
        console.error("useActiveLoans error:", err);
        setLoans(DEFAULT_LOANS);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, limit, filters, sortConfig]);

  useEffect(() => {
    fetchActiveLoans();
  }, [fetchActiveLoans]);

  const handleFilterChange = useCallback(
    (key: keyof ActiveLoanFilters, value: string | number) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({ search: "", dueDateFrom: "", dueDateTo: "", minRemainingAmount: 0 });
    setPage(1);
  }, []);

  const toggleLoanSelection = useCallback((id: number) => {
    setSelectedLoans((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedLoans.length === loans.length) {
      setSelectedLoans([]);
    } else {
      setSelectedLoans(loans.map((l) => l.id));
    }
  }, [loans, selectedLoans]);

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  }, []);

  const reload = useCallback(() => {
    fetchActiveLoans();
  }, [fetchActiveLoans]);

  const setPageSizeHandler = useCallback((size: number) => {
    setLimit(size);
    setPage(1);
  }, []);

  return {
    loans,
    loading,
    error,
    total: paginationMeta.totalItems,
    pagination: {
      page: paginationMeta.page,
      totalPages: paginationMeta.totalPages,
      totalItems: paginationMeta.totalItems,
      limit: paginationMeta.limit,
    },
    filters,
    selectedLoans,
    setSelectedLoans,
    sortConfig,
    setSortConfig,
    limit,
    setLimit: setPageSizeHandler,
    page,
    setPage,
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

export default useActiveLoans;