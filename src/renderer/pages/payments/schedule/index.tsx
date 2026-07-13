// src/renderer/pages/payments/schedule/index.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Download, RefreshCw, Eye, EyeOff } from "lucide-react";
import usePaymentSchedule from "./hooks/usePaymentSchedule";
import DateRangeFilter from "./components/DateRangeFilter";
import ViewModeToggle from "./components/ViewModeToggle";
import ListView from "./components/ListView";
import CalendarView from "./components/CalendarView";
import MarkPaidModal from "./components/MarkPaidModal";
import ExportModal from "./components/ExportModal";
import DateClickModal from "./components/DateClickModal";
import PaymentScheduleSummary from "./components/PaymentScheduleSummary";
import type { ScheduledPayment } from "./types";
import { usePagination } from "../../../contexts/PaginationContext";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

const PaymentSchedulePage: React.FC = () => {
  const {
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
  } = usePaymentSchedule();

  const { setPagination, clearPagination } = usePagination();

  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ScheduledPayment | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [dateClickModalOpen, setDateClickModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState("");
  const [clickedPayments, setClickedPayments] = useState<ScheduledPayment[]>([]);
  const [showStats, setShowStats] = useState(true);

  // Stable pagination handlers
  const handlePageChange = useCallback(
    (newPage: number) => setPage(newPage),
    [setPage]
  );
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setLimit(newSize);
      setPage(1);
    },
    [setLimit, setPage]
  );

  const handlersRef = useRef({ onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
  useEffect(() => {
    handlersRef.current = { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange };
  }, [handlePageChange, handlePageSizeChange]);

  const prevPageRef = useRef(page);
  const prevTotalRef = useRef(totalItems);
  const prevLimitRef = useRef(limit);

  // Sync with global pagination context
  useEffect(() => {
    const pageChanged = prevPageRef.current !== page;
    const totalChanged = prevTotalRef.current !== totalItems;
    const limitChanged = prevLimitRef.current !== limit;

    if (pageChanged || totalChanged || limitChanged) {
      prevPageRef.current = page;
      prevTotalRef.current = totalItems;
      prevLimitRef.current = limit;

      setPagination({
        currentPage: page,
        totalItems: totalItems,
        pageSize: limit,
        onPageChange: handlersRef.current.onPageChange,
        onPageSizeChange: handlersRef.current.onPageSizeChange,
        pageSizeOptions: [10, 25, 50, 100],
        showPageSize: true,
      });
    }
  }, [page, totalItems, limit, setPagination]);

  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  const handleMarkPaid = (payment: ScheduledPayment) => {
    setSelectedPayment(payment);
    setMarkPaidModalOpen(true);
  };

  const handleConfirmMarkPaid = async (amount: number, paymentDate: string, methodId: number) => {
    if (selectedPayment) {
      await markAsPaid(selectedPayment.debtId, amount, paymentDate, methodId);
      refresh();
    }
  };

  const handleDateClick = (date: string, paymentsOnDate: ScheduledPayment[]) => {
    setClickedDate(date);
    setClickedPayments(paymentsOnDate);
    setDateClickModalOpen(true);
  };

  const handleMarkPaidFromModal = (payment: ScheduledPayment) => {
    setDateClickModalOpen(false);
    setSelectedPayment(payment);
    setMarkPaidModalOpen(true);
  };

  const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);
  const hasFilters = filters.dateRange !== "30";

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--primary-color)]" />
            Payment Schedule
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            View and manage upcoming payments from debtors
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title={showStats ? "Hide summary" : "Show summary"}
          >
            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            disabled={payments.length === 0}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && payments.length > 0 && (
        <PaymentScheduleSummary
          totalPayments={totalItems}
          totalAmountDue={totalDue}
          dateRange={filters.dateRange}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter
          value={filters.dateRange}
          onChange={(val) => setFilters(prev => ({ ...prev, dateRange: val }))}
        />
        <ViewModeToggle
          mode={filters.viewMode}
          onChange={(mode) => setFilters(prev => ({ ...prev, viewMode: mode }))}
        />
      </div>

      {/* Page info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--text-secondary)]">Show:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-primary)",
            }}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {totalItems > 0
            ? `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, totalItems)} of ${totalItems} payments`
            : "No payments"}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8 text-[var(--danger-color)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)]">
          <p className="text-sm">Error: {error}</p>
          <button
            onClick={refresh}
            className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No upcoming payments</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hasFilters ? "Try adjusting your date range" : "All active debts have due dates beyond your selected range"}
              </p>
            </div>
          ) : filters.viewMode === "list" ? (
            <ListView payments={payments} onMarkPaid={handleMarkPaid} />
          ) : (
            <CalendarView payments={payments} onDateClick={handleDateClick} />
          )}
        </>
      )}

      {/* Modals */}
      <MarkPaidModal
        isOpen={markPaidModalOpen}
        payment={selectedPayment}
        onClose={() => {
          setMarkPaidModalOpen(false);
          setSelectedPayment(null);
        }}
        onConfirm={handleConfirmMarkPaid}
      />
      <ExportModal
        isOpen={exportModalOpen}
        payments={payments}
        onClose={() => setExportModalOpen(false)}
      />
      <DateClickModal
        isOpen={dateClickModalOpen}
        date={clickedDate}
        payments={clickedPayments}
        onClose={() => setDateClickModalOpen(false)}
        onMarkPaid={handleMarkPaidFromModal}
      />
    </div>
  );
};

export default PaymentSchedulePage;