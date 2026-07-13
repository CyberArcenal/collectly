// src/renderer/pages/payments/schedule/hooks/usePaymentSchedule.ts

import { useState, useEffect, useCallback } from "react";
import debtsAPI from "../../../../api/core/debt";
import paymentsAPI from "../../../../api/core/payment_transaction";
import type { ScheduledPayment, PaymentScheduleFilters } from "../types";

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

      // Access the data array and pagination
      const debts = response.data.data || [];
      const pagination = response.data.pagination || { total: 0 };

      // Map to ScheduledPayment, safely extracting borrower info
      const scheduled: ScheduledPayment[] = debts.map((debt: any) => {
        // Try to get borrower name from different possible fields
        const borrowerName =
          debt.borrower?.name ||
          debt.borrower_name ||
          debt.borrowerName ||
          "Unknown";

        const borrowerId = debt.borrower?.id ?? debt.borrower_id ?? 0;

        return {
          debtId: debt.id,
          debtName: debt.name || "Unnamed Debt",
          borrowerId,
          borrowerName,
          dueDate: debt.dueDate || new Date().toISOString().split('T')[0],
          amountDue: debt.remainingAmount ?? debt.remaining_amount ?? 0,
          contact: debt.borrower?.contact || debt.contact || null,
          email: debt.borrower?.email || debt.email || null,
        };
      });

      setPayments(scheduled);
      setTotalItems(pagination.total || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching payment schedule.");
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange, page, limit]);

  useEffect(() => {
    fetchUpcomingPayments();
  }, [fetchUpcomingPayments]);

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
      // Refresh the list after marking paid
      await fetchUpcomingPayments();
    } catch (err: any) {
      throw new Error(err.message || "Failed to record payment");
    }
  };

  const refresh = () => fetchUpcomingPayments();

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
  };
};

export default usePaymentSchedule;