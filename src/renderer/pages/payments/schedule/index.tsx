// src/renderer/pages/payments/schedule/index.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Download, RefreshCw } from "lucide-react";
import usePaymentSchedule from "./hooks/usePaymentSchedule";
import DateRangeFilter from "./components/DateRangeFilter";
import ViewModeToggle from "./components/ViewModeToggle";
import ListView from "./components/ListView";
import CalendarView from "./components/CalendarView";
import MarkPaidModal from "./components/MarkPaidModal";
import ExportModal from "./components/ExportModal";
import DateClickModal from "./components/DateClickModal";
import type { ScheduledPayment } from "./types";
import { usePagination } from "../../../contexts/PaginationContext";

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

  // Display range
  const getDisplayRange = () => {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalItems);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div className="m-1" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Payment Schedule</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => setExportModalOpen(true)} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-md flex flex-wrap justify-between items-center gap-3" style={{ backgroundColor: "var(--card-secondary-bg)", border: `1px solid var(--border-color)` }}>
          <div>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Total Upcoming Payments:</span>
            <span style={{ color: "var(--text-primary)" }}>{totalItems} debts</span>
          </div>
          <div>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Total Amount Due:</span>
            <span style={{ color: "var(--text-primary)" }}>{totalDue.toLocaleString()} PHP</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <DateRangeFilter value={filters.dateRange} onChange={(val) => setFilters(prev => ({ ...prev, dateRange: val }))} />
          <ViewModeToggle mode={filters.viewMode} onChange={(mode) => setFilters(prev => ({ ...prev, viewMode: mode }))} />
        </div>

        {/* Page info and pagination controls (inline) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Show:
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {totalItems > 0
              ? `Showing ${start} to ${end} of ${totalItems} entries`
              : 'No entries'}
          </div>
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>}
        {error && <div className="text-center py-4" style={{ color: "var(--danger-color)" }}>Error: {error}</div>}

        {!loading && !error && payments.length === 0 && (
          <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No upcoming payments</p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>All active debts have due dates beyond your selected range.</p>
          </div>
        )}

        {!loading && !error && payments.length > 0 && (
          filters.viewMode === "list" ? (
            <ListView payments={payments} onMarkPaid={handleMarkPaid} />
          ) : (
            <CalendarView payments={payments} onDateClick={handleDateClick} />
          )
        )}
      </div>

      <MarkPaidModal isOpen={markPaidModalOpen} payment={selectedPayment} onClose={() => { setMarkPaidModalOpen(false); setSelectedPayment(null); }} onConfirm={handleConfirmMarkPaid} />
      <ExportModal isOpen={exportModalOpen} payments={payments} onClose={() => setExportModalOpen(false)} />
      <DateClickModal isOpen={dateClickModalOpen} date={clickedDate} payments={clickedPayments} onClose={() => setDateClickModalOpen(false)} onMarkPaid={handleMarkPaidFromModal} />
    </div>
  );
};

export default PaymentSchedulePage;