// src/renderer/pages/loans/applications/hooks/useLoanApplications.ts
import { useState, useEffect, useCallback } from "react";
import type { LoanApplication } from "../../../../api/core/loan_application";
import loanApplicationsAPI from "../../../../api/core/loan_application";

interface UseLoanApplicationsReturn {
  applications: LoanApplication[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  activeTab: "pending" | "approved" | "rejected";
  setActiveTab: (tab: "pending" | "approved" | "rejected") => void;
  refresh: () => Promise<void>;
  approve: (id: number) => Promise<void>;
  reject: (id: number, reason?: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
  stats: {
    totalApplications: number;
    pending: number;
    approved: number;
    rejected: number;
    totalRequestedAmount: number;
  } | null;
  fetchStats: () => Promise<void>;
}

const useLoanApplications = (initialPageSize = 9): UseLoanApplicationsReturn => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<UseLoanApplicationsReturn["stats"]>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await loanApplicationsAPI.getStatistics();
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch application stats:", err);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await loanApplicationsAPI.getAll({
        status: activeTab,
        page: currentPage,
        limit: pageSize,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      if (response.status) {
        setApplications(response.data.data);
        setTotalItems(response.data.pagination.total);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Failed to load loan applications:", err);
      setApplications([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, pageSize]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const approve = async (id: number) => {
    try {
      const response = await loanApplicationsAPI.approve(id);
      if (response.status) {
        await loadApplications();
        await fetchStats();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Approve failed:", err);
      throw err;
    }
  };

  const reject = async (id: number, reason?: string) => {
    try {
      const response = await loanApplicationsAPI.reject(id, reason);
      if (response.status) {
        await loadApplications();
        await fetchStats();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Reject failed:", err);
      throw err;
    }
  };

  const remove = async (id: number) => {
    try {
      const response = await loanApplicationsAPI.delete(id);
      if (response.status) {
        await loadApplications();
        await fetchStats();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      throw err;
    }
  };

  const refresh = async () => {
    await loadApplications();
    await fetchStats();
  };

  return {
    applications,
    loading,
    totalItems,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    activeTab,
    setActiveTab,
    refresh,
    approve,
    reject,
    remove,
    stats,
    fetchStats,
  };
};

export default useLoanApplications;