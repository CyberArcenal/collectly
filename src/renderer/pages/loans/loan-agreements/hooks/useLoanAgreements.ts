// src/renderer/pages/loans/agreements/hooks/useLoanAgreements.ts
import { useState, useEffect, useCallback, useRef } from "react";
import type { LoanAgreement, LoanAgreementStatistics } from "../../../../api/core/loan_agreement";
import loanAgreementsAPI from "../../../../api/core/loan_agreement";

interface Filters {
  search: string;
  status: "all" | "draft" | "signed";
  debtId?: number;
  lenderName?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface Stats extends LoanAgreementStatistics{
  signed?: number;
}

export const useLoanAgreements = () => {
  const [agreements, setAgreements] = useState<LoanAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    debtId: undefined,
    lenderName: "",
    dateFrom: "",
    dateTo: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "agreementDate",
    direction: "desc" as "asc" | "desc",
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedAgreements, setSelectedAgreements] = useState<number[]>([]);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await loanAgreementsAPI.getStatistics();
      console.log("Loan agreement stats: ", response)
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch agreement stats:", err);
    }
  }, []);

  const fetchAgreements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction.toUpperCase(),
        search: filters.search || undefined,
        lenderName: filters.lenderName || undefined,
        agreementDateFrom: filters.dateFrom || undefined,
        agreementDateTo: filters.dateTo || undefined,
        debtId: filters.debtId || undefined,
      };
      if (filters.status !== "all") params.status = filters.status;
      const response = await loanAgreementsAPI.getAll(params);
      if (response.status && response.data) {
        setAgreements(response.data.data);
        setTotalItems(response.data.pagination.total);
      } else {
        throw new Error(response.message || "Failed to fetch agreements");
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, sortConfig, filters]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const reload = useCallback(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      debtId: undefined,
      lenderName: "",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const setPageSizeHandler = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const toggleAgreementSelection = (id: number) => {
    setSelectedAgreements((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedAgreements((prev) =>
      prev.length === agreements.length ? [] : agreements.map((a) => a.id)
    );
  };

  return {
    agreements,
    loading,
    error,
    totalItems,
    currentPage,
    pageSize,
    filters,
    sortConfig,
    selectedAgreements,
    setSelectedAgreements,
    setCurrentPage,
    setPageSize: setPageSizeHandler,
    handleFilterChange,
    resetFilters,
    handleSort,
    reload,
    stats,
    fetchStats,
    toggleAgreementSelection,
    toggleSelectAll,
  };
};