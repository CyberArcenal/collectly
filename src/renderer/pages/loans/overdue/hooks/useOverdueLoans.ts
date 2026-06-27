// src/renderer/pages/loans/overdue/hooks/useOverdueLoans.ts

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";

export interface OverdueFilter {
  search: string;
  daysOverdue: string; // "all", "30", "60", "90"
}

export interface OverdueLoan extends Debt {
  stats: NonNullable<Debt["stats"]>;
}

interface UseOverdueLoansReturn {
  loans: OverdueLoan[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  filters: OverdueFilter;
  selectedLoans: number[];
  setSelectedLoans: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string; direction: "asc" | "desc" }>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  handleFilterChange: (key: keyof OverdueFilter, value: string) => void;
  resetFilters: () => void;
  toggleLoanSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
}

const useOverdueLoans = (): UseOverdueLoansReturn => {
  const [allLoans, setAllLoans] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "daysOverdue",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<OverdueFilter>({ search: "", daysOverdue: "all" });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Compute daysOverdue for a debt
  const computeDaysOverdue = (debt: Debt): number => {
    if (debt.stats?.daysOverdue !== undefined) return debt.stats.daysOverdue;
    const dueDate = new Date(debt.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const fetchOverdueLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Fetch all debts with dueDate <= today (overdue by date)
      const response = await debtsAPI.getAll({
        includeDeleted: false,
        limit: 1000, // fetch all for now; we'll do frontend pagination
        dueDateTo: todayStr,
        sortBy: "dueDate",
        sortOrder: "ASC",
      });

      if (!response.status) throw new Error(response.message || "Failed to fetch overdue loans");

      // Filter: only active or overdue, and not paid/defaulted, and remaining > 0
      let filtered = response.data.data.filter(debt => {
        const isActiveOrOverdue = debt.status === "active" || debt.status === "overdue";
        const hasRemaining = debt.remainingAmount > 0.01;
        return isActiveOrOverdue && hasRemaining;
      });

      // Ensure stats exist
      const withStats: OverdueLoan[] = filtered.map(debt => ({
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

      setAllLoans(withStats);
    } catch (err: any) {
      if (mountedRef.current) setError(err.message || "Failed to load overdue loans");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverdueLoans();
  }, [fetchOverdueLoans]);

  // Apply filters and sorting, then paginate
  const filteredAndSortedLoans = useMemo(() => {
    let result = [...allLoans];

    // Search filter
    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      result = result.filter(loan =>
        loan.name.toLowerCase().includes(search) ||
        loan.borrower?.name?.toLowerCase().includes(search) ||
        loan.borrower?.contact?.toLowerCase().includes(search) ||
        loan.borrower?.email?.toLowerCase().includes(search)
      );
    }

    // Days overdue filter
    if (filters.daysOverdue !== "all") {
      const minDays = parseInt(filters.daysOverdue);
      result = result.filter(loan => loan.stats.daysOverdue >= minDays);
    }

    // Sorting
    const key = sortConfig.key;
    const direction = sortConfig.direction;
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      if (key === "daysOverdue") {
        aVal = a.stats.daysOverdue;
        bVal = b.stats.daysOverdue;
      } else if (key === "borrower") {
        aVal = a.borrower?.name || "";
        bVal = b.borrower?.name || "";
      } else if (key === "remainingAmount") {
        aVal = a.remainingAmount;
        bVal = b.remainingAmount;
      } else if (key === "dueDate") {
        aVal = new Date(a.dueDate);
        bVal = new Date(b.dueDate);
      } else if (key === "name") {
        aVal = a.name;
        bVal = b.name;
      } else {
        aVal = a[key as keyof Debt];
        bVal = b[key as keyof Debt];
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allLoans, filters, sortConfig]);

  // Paginate
  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSortedLoans.slice(start, end);
  }, [filteredAndSortedLoans, currentPage, pageSize]);

  const totalItems = filteredAndSortedLoans.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Ensure currentPage is within bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleFilterChange = (key: keyof OverdueFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", daysOverdue: "all" });
    setCurrentPage(1);
  };

  const toggleLoanSelection = (id: number) => {
    setSelectedLoans(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedLoans(prev =>
      prev.length === paginatedLoans.length ? [] : paginatedLoans.map(l => l.id)
    );
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
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
    loans: paginatedLoans,
    loading,
    error,
    pagination: {
      page: currentPage,
      totalPages,
      totalItems,
      pageSize,
    },
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
    handleFilterChange,
    resetFilters,
    toggleLoanSelection,
    toggleSelectAll,
    handleSort,
  };
};

export default useOverdueLoans;