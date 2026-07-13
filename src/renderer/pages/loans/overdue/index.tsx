// src/renderer/pages/loans/overdue/index.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  X,
  Bell,
  Download,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import Button from "../../../components/UI/Button";
import useOverdueLoans from "./hooks/useOverdueLoans";
import OverdueLoansTable from "./components/OverdueLoansTable";
import RecordPartialPaymentModal from "./components/RecordPartialPaymentModal";
import ApplyPenaltyModal from "./components/ApplyPenaltyModal";
import SendReminderModal from "./components/SendReminderModal";
import { dialogs } from "../../../utils/dialogs";
import reminderLogAPI from "../../../api/core/reminder_log";
import debtsAPI from "../../../api/core/debt";
import { usePagination } from "../../../contexts/PaginationContext";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import OverdueSummaryCards from "./components/OverdueSummaryCards";
import BulkActionsBar from "./components/BulkActionsBar";

const OverdueLoansPage: React.FC = () => {
  const {
    loans,
    loading,
    error,
    pagination,
    filters,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleLoanSelection,
    toggleSelectAll,
    handleSort,
    sortConfig,
    selectedLoans,
    setSelectedLoans,
    stats,
    fetchStats,
  } = useOverdueLoans();

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [exporting, setExporting] = useState(false);

  const { setPagination, clearPagination } = usePagination();

  const hasFilters = !!(filters.search || (filters.daysOverdue && filters.daysOverdue !== "all"));

  // Stable pagination handlers
  const handlePageChange = useCallback(
    (newPage: number) => setCurrentPage(newPage),
    [setCurrentPage]
  );
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1);
    },
    [setPageSize, setCurrentPage]
  );

  const handlersRef = useRef({
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  });
  useEffect(() => {
    handlersRef.current = {
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    };
  }, [handlePageChange, handlePageSizeChange]);

  const prevPageRef = useRef(currentPage);
  const prevTotalRef = useRef(pagination.totalItems);
  const prevLimitRef = useRef(pageSize);

  useEffect(() => {
    const pageChanged = prevPageRef.current !== currentPage;
    const totalChanged = prevTotalRef.current !== pagination.totalItems;
    const limitChanged = prevLimitRef.current !== pageSize;

    if (pageChanged || totalChanged || limitChanged) {
      prevPageRef.current = currentPage;
      prevTotalRef.current = pagination.totalItems;
      prevLimitRef.current = pageSize;

      setPagination({
        currentPage,
        totalItems: pagination.totalItems,
        pageSize,
        onPageChange: handlersRef.current.onPageChange,
        onPageSizeChange: handlersRef.current.onPageSizeChange,
        pageSizeOptions: [10, 25, 50, 100],
        showPageSize: true,
      });
    }
  }, [currentPage, pagination.totalItems, pageSize, setPagination]);

  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const openPaymentModal = (loan: any) => {
    setSelectedLoan(loan);
    setPaymentModalOpen(true);
  };

  const openPenaltyModal = (loan: any) => {
    setSelectedLoan(loan);
    setPenaltyModalOpen(true);
  };

  const openReminderModal = (loan: any) => {
    setSelectedLoan(loan);
    setReminderModalOpen(true);
  };

  const handleBulkSendReminders = async () => {
    if (selectedLoans.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Reminders",
      message: `Send email reminders to ${selectedLoans.length} overdue debtors?`,
    });
    if (!confirmed) return;

    let successCount = 0;
    let failCount = 0;
    setSubmitting(true);
    try {
      for (const id of selectedLoans) {
        const loan = loans.find((l) => l.id === id);
        if (loan && loan.borrower?.email) {
          try {
            await reminderLogAPI.createReminder({
              to: loan.borrower.email,
              subject: `Overdue Reminder: ${loan.name}`,
              html: `Dear ${loan.borrower.name},<br/><br/>Your loan "${loan.name}" is overdue. Please make a payment immediately.<br/><br/>Thank you.`,
              text: `Dear ${loan.borrower.name},\n\nYour loan "${loan.name}" is overdue. Please make a payment immediately.\n\nThank you.`,
            });
            successCount++;
          } catch (err) {
            console.error(`Failed to send to ${loan.borrower.email}`, err);
            failCount++;
          }
        } else if (loan && !loan.borrower?.email) {
          console.warn(`Debtor ${loan.borrower?.name} has no email`);
          failCount++;
        }
      }
      dialogs.success(`Reminders sent: ${successCount} succeeded, ${failCount} failed.`);
      reload();
      fetchStats();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedLoans.length === 0) return;
    setExporting(true);
    try {
      const selected = loans.filter((l) => selectedLoans.includes(l.id));
      const headers = [
        "ID",
        "Debt Name",
        "Borrower",
        "Remaining Balance",
        "Due Date",
        "Days Overdue",
        "Total Penalty",
      ];
      const rows = selected.map((l) => [
        l.id,
        l.name,
        l.borrower?.name || "",
        l.remainingAmount,
        l.dueDate,
        l.stats?.daysOverdue || 0,
        l.stats?.totalPenalty || 0,
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `overdue_loans_${new Date().toISOString().slice(0, 19)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      dialogs.success("Export completed");
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const response = await debtsAPI.export("csv", {
        status: "overdue",
        limit: 10000,
      });
      if (response.status && response.data?.data) {
        const blob = new Blob([response.data.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename || `all_overdue_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        dialogs.success("Export completed");
      }
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[var(--danger-color)]" />
            Overdue Accounts
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage overdue loans, apply penalties, and send reminders
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
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportAll}
            disabled={exporting || loans.length === 0}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Export all"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={reload}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {selectedLoans.length > 0 && (
            <button
              onClick={handleBulkSendReminders}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary-color)" }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "var(--primary-hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-color)";
              }}
            >
              <Bell className="w-4 h-4" />
              Send Reminders ({selectedLoans.length})
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && stats && (
        <OverdueSummaryCards
          total={stats.total}
          totalAmount={stats.totalAmount}
          averageDaysOverdue={stats.averageDaysOverdue}
          totalPenalties={stats.totalPenalties}
        />
      )}

      {/* Filters Bar */}
      {showFilters && (
        <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </span>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search by debtor, contact, or debt..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <select
              value={filters.daysOverdue}
              onChange={(e) => handleFilterChange("daysOverdue", e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="all">All Overdue</option>
              <option value="30">30+ days overdue</option>
              <option value="60">60+ days overdue</option>
              <option value="90">90+ days overdue</option>
            </select>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedLoans.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedLoans.length}
          onSendReminders={handleBulkSendReminders}
          onExport={handleBulkExport}
          onClearSelection={() => setSelectedLoans([])}
          exporting={exporting}
          sending={submitting}
        />
      )}

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
            onClick={reload}
            className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <OverdueLoansTable
            loans={loans}
            selectedLoans={selectedLoans}
            onToggleSelect={toggleLoanSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onSendReminder={openReminderModal}
            onRecordPayment={openPaymentModal}
            onApplyPenalty={openPenaltyModal}
          />
          {loans.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No overdue accounts</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hasFilters ? "Try adjusting your filters" : "All debts are up to date"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <RecordPartialPaymentModal
        isOpen={paymentModalOpen}
        loan={selectedLoan}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={() => {
          reload();
          fetchStats();
        }}
      />
      <ApplyPenaltyModal
        isOpen={penaltyModalOpen}
        loan={selectedLoan}
        onClose={() => {
          setPenaltyModalOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={() => {
          reload();
          fetchStats();
        }}
      />
      <SendReminderModal
        isOpen={reminderModalOpen}
        loan={selectedLoan}
        onClose={() => {
          setReminderModalOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={() => {
          reload();
          fetchStats();
        }}
      />
    </div>
  );
};

export default OverdueLoansPage;