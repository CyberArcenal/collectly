// src/renderer/pages/debtors/hooks/useDebtors.ts
import { useState, useEffect, useCallback, useRef } from "react";
import borrowersAPI from "../../../api/core/borrower";
import debtsAPI from "../../../api/core/debt";
import type { Borrower } from "../../../api/core/borrower";

export interface DebtorFilters {
  search: string;
  status: "all" | "active" | "deleted";
}

export interface DebtorWithTotal extends Borrower {
  total_debt: number;
}

export interface DebtorStats {
  total: number;
  active: number;
  deleted: number;
  withEmail: number;
  withContact: number;
}

interface UseDebtorsReturn {
  debtors: DebtorWithTotal[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  filters: DebtorFilters;
  selectedDebtors: number[];
  setSelectedDebtors: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string; direction: "asc" | "desc" }>>;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  fetchStats: () => Promise<void>;
  handleFilterChange: (key: keyof DebtorFilters, value: string) => void;
  resetFilters: () => void;
  toggleDebtorSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
  stats: DebtorStats | null;
}

const useDebtors = (initialFilters?: Partial<DebtorFilters>): UseDebtorsReturn => {
  const [debtors, setDebtors] = useState<DebtorWithTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDebtors, setSelectedDebtors] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<DebtorStats | null>(null);
  const [filters, setFilters] = useState<DebtorFilters>({
    search: "",
    status: "active",
    ...initialFilters,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const getIncludeDeleted = (status: string) => {
    if (status === "deleted") return true;
    if (status === "active") return false;
    return true;
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await borrowersAPI.getStatistics();
      console.log(response)
      if (response.status) {
        const data = response.data;
        setStats({
          total: data.total || 0,
          active: data.active || 0,
          deleted: data.deleted || 0,
          withEmail: data.totalWithEmail || data.with_email || data.withEmail || 0,
          withContact: data.totalWithContact || data.with_contact || data.withContact || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch debtor stats:", err);
    }
  }, []);

  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const includeDeleted = getIncludeDeleted(filters.status);
      const response = await borrowersAPI.getAll({
        page: currentPage,
        limit: pageSize,
        search: filters.search || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction.toUpperCase() as "ASC" | "DESC",
        includeDeleted,
      });

      if (!response.status) throw new Error(response.message || "Failed to fetch debtors");

      const borrowersData = response.data.data;
      const pagination = response.data.pagination;

      if (borrowersData.length > 0) {
        const borrowerIds = borrowersData.map(b => b.id);
        const debtPromises = borrowerIds.map(async (id) => {
          try {
            const debtsRes = await debtsAPI.getAll({ borrowerId: id, limit: 1000 });
            if (debtsRes.status) {
              const total = debtsRes.data.data.reduce((sum, debt) => sum + debt.remainingAmount, 0);
              return { id, total };
            }
            return { id, total: 0 };
          } catch {
            return { id, total: 0 };
          }
        });
        const totals = await Promise.all(debtPromises);
        const totalMap = new Map(totals.map(t => [t.id, t.total]));

        const debtorsWithTotal: DebtorWithTotal[] = borrowersData.map(d => ({
          ...d,
          total_debt: totalMap.get(d.id) || 0,
        }));
        if (mountedRef.current) {
          setDebtors(debtorsWithTotal);
          setTotalItems(pagination.total);
        }
      } else {
        if (mountedRef.current) {
          setDebtors([]);
          setTotalItems(pagination.total);
        }
      }
      setError(null);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to load debtors");
        console.error(err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, filters.search, filters.status, sortConfig.key, sortConfig.direction]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  const handleFilterChange = useCallback((key: keyof DebtorFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ search: "", status: "active" });
    setCurrentPage(1);
  }, []);

  const toggleDebtorSelection = useCallback((id: number) => {
    setSelectedDebtors(prev =>
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedDebtors.length === debtors.length) {
      setSelectedDebtors([]);
    } else {
      setSelectedDebtors(debtors.map(d => d.id));
    }
  }, [debtors, selectedDebtors]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }, []);

  const reload = useCallback(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    debtors,
    loading,
    error,
    totalItems,
    currentPage,
    pageSize,
    filters,
    selectedDebtors,
    setSelectedDebtors,
    sortConfig,
    setSortConfig,
    setPageSize: setPageSizeHandler,
    setCurrentPage,
    reload,
    fetchStats,
    handleFilterChange,
    resetFilters,
    toggleDebtorSelection,
    toggleSelectAll,
    handleSort,
    stats,
  };
};

export default useDebtors;