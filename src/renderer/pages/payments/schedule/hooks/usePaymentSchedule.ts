// src/renderer/pages/payments/schedule/hooks/usePaymentSchedule.ts

import { useState, useEffect, useCallback } from "react";
import debtsAPI from "../../../../api/core/debt";
import paymentsAPI from "../../../../api/core/payment_transaction";
import type { ScheduledPayment, PaymentScheduleFilters } from "../types";

// Add type for debt statistics
interface DebtStats {
  totalDebts: number;
  totalActive: number;
  totalPaid: number;
  totalOverdue: number;
  totalDefaulted: number;
  totalAmountOwed: number;
  totalRemainingBalance: number;
}

interface UsePaymentScheduleReturn {
  payments: ScheduledPayment[];
  loading: boolean;
  error: string | null;
  filters: PaymentScheduleFilters;
  setFilters: React.Dispatch<React.SetStateAction<PaymentScheduleFilters>>;
  refresh: () => void;
  markAsPaid: (debtId: number, amount: number, paymentDate: string, methodId: number) => Promise<void>;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  totalItems: number;
  // New stats
  debtStats: DebtStats | null;
  loadingStats: boolean;
}

const usePaymentSchedule = (): UsePaymentScheduleReturn => {
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentScheduleFilters>({
    dateRange: "30",
    viewMode: "list",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // New stats state
  const [debtStats, setDebtStats] = useState<DebtStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch overall debt statistics
  const fetchDebtStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await debtsAPI.getStatistics();
      if (response.status) {
        setDebtStats({
          totalDebts: response.data.totalDebts || 0,
          totalActive: response.data.totalActive || 0,
          totalPaid: response.data.totalPaid || 0,
          totalOverdue: response.data.totalOverdue || 0,
          totalDefaulted: response.data.totalDefaulted || 0,
          totalAmountOwed: response.data.totalAmountOwed || 0,
          totalRemainingBalance: response.data.totalRemainingBalance || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch debt stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch upcoming payments
  const fetchUpcomingPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cutoffDays = filters.dateRange === "all" ? 365 : parseInt(filters.dateRange);
      const cutoffDate = new Date(today);
      cutoffDate.setDate(today.getDate() + cutoffDays);

      const response = await debtsAPI.getAll({
        status: "active",
        includeDeleted: false,
        dueDateFrom: today.toISOString().split('T')[0],
        dueDateTo: cutoffDate.toISOString().split('T')[0],
        page,
        limit,
        sortBy: "dueDate",
        sortOrder: "ASC",
      });

      if (!response.status) throw new Error(response.message || "Failed to fetch debts");

      const debts = response.data.data || [];
      const pagination = response.data.pagination || { total: 0 };

      const scheduled: ScheduledPayment[] = debts.map((debt: any) => ({
        debtId: debt.id,
        debtName: debt.name || "Unnamed Debt",
        borrowerId: debt.borrower?.id ?? 0,
        borrowerName: debt.borrower?.name || debt.borrower_name || "Unknown",
        dueDate: debt.dueDate || new Date().toISOString().split('T')[0],
        amountDue: debt.remainingAmount ?? debt.remaining_amount ?? 0,
        contact: debt.borrower?.contact || null,
        email: debt.borrower?.email || null,
      }));

      setPayments(scheduled);
      setTotalItems(pagination.total || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching payment schedule.");
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange, page, limit]);

  // Fetch both on mount and when dependencies change
  useEffect(() => {
    fetchUpcomingPayments();
    fetchDebtStats();
  }, [fetchUpcomingPayments, fetchDebtStats]);

  const markAsPaid = async (debtId: number, amount: number, paymentDate: string, methodId: number) => {
    try {
      await paymentsAPI.create({
        amount,
        paymentDate,
        reference: `Scheduled payment on ${paymentDate}`,
        notes: null,
        debtId,
        methodId,
      });
      await fetchUpcomingPayments();
      await fetchDebtStats(); // Refresh stats after payment
    } catch (err: any) {
      throw new Error(err.message || "Failed to record payment");
    }
  };

  const refresh = () => {
    fetchUpcomingPayments();
    fetchDebtStats();
  };

  return {
    payments,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    markAsPaid,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    // New exports
    debtStats,
    loadingStats,
  };
};

export default usePaymentSchedule;