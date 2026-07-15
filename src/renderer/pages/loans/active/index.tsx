// src/renderer/pages/loans/active/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { HandCoins, RefreshCw, Filter, Eye, EyeOff, Download, X, Plus } from "lucide-react";
import Button from "../../../components/UI/Button";
import useActiveLoans from "./hooks/useActiveLoans";
import ActiveLoansTable from "./components/ActiveLoansTable";
import RecordPaymentModal from "./components/RecordPaymentModal";
import ViewDebtModal from "./components/ViewDebtModal";
import EditDebtModal from "./components/EditDebtModal";
import type { Debt } from "../../../api/core/debt";
import debtsAPI from "../../../api/core/debt";
import { dialogs } from "../../../utils/dialogs";
import { ForgivenessDialog } from "./components/ForgivenessDialog";
import ViewLoanAgreementModal from "./components/ViewLoanAgreementModal";
import PaymentScheduleModal from "./components/PaymentScheduleModal";
import { usePagination } from "../../../contexts/PaginationContext";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import LoanSummaryCards from "./components/LoanSummaryCards";
import BulkActionsBar from "./components/BulkActionsBar";
import { showSuccess } from "../../../utils/notification";

const ActiveLoansPage: React.FC = () => {
  const {
    loans,
    loading,
    total,
    error,
    pagination,
    filters,
    limit,
    setLimit,
    page,
    setPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleLoanSelection,
    toggleSelectAll,
    handleSort,
    sortConfig,
    selectedLoans,
    stats,
    fetchStats,
  } = useActiveLoans();

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [forgivenessDialogOpen, setForgivenessDialogOpen] = useState(false);
  const [forgivenessLoan, setForgivenessLoan] = useState<Debt | null>(null);
  const [forgivenessLoading, setForgivenessLoading] = useState(false);

  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [selectedDebtForAgreement, setSelectedDebtForAgreement] = useState<Debt | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleLoan, setScheduleLoan] = useState<Debt | null>(null);

  const { setPagination, clearPagination } = usePagination();

  const hasFilters = !!(filters.search || filters.dueDateFrom || filters.dueDateTo || filters.minRemainingAmount > 0);

  // Stable pagination handlers
  const handlePageChange = useCallback((newPage: number) => setPage(newPage), [setPage]);
  const handlePageSizeChange = useCallback((newSize: number) => {
    setLimit(newSize);
    setPage(1);
  }, [setLimit, setPage]);

  const handlersRef = useRef({ onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
  useEffect(() => {
    handlersRef.current = { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange };
  }, [handlePageChange, handlePageSizeChange]);

  const prevPageRef = useRef(page);
  const prevTotalRef = useRef(total);
  const prevLimitRef = useRef(limit);

  useEffect(() => {
    const pageChanged = prevPageRef.current !== page;
    const totalChanged = prevTotalRef.current !== total;
    const limitChanged = prevLimitRef.current !== limit;

    if (pageChanged || totalChanged || limitChanged) {
      prevPageRef.current = page;
      prevTotalRef.current = total;
      prevLimitRef.current = limit;

      setPagination({
        currentPage: page,
        totalItems: total,
        pageSize: limit,
        onPageChange: handlersRef.current.onPageChange,
        onPageSizeChange: handlersRef.current.onPageSizeChange,
        pageSizeOptions: [10, 25, 50, 100],
        showPageSize: true,
      });
    }
  }, [page, total, limit, setPagination]);

  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  // Fetch stats on mount and refresh
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleForgiveness = (loan: Debt) => {
    setForgivenessLoan(loan);
    setForgivenessDialogOpen(true);
  };

  const handleViewAgreement = (loan: Debt) => {
    setSelectedDebtForAgreement(loan);
    setAgreementModalOpen(true);
  };

  const handleSchedule = (loan: Debt) => {
    setScheduleLoan(loan);
    setScheduleModalOpen(true);
  };

  const handleForgivenessConfirm = async (amount: number, reason?: string) => {
    if (!forgivenessLoan) return;
    setForgivenessLoading(true);
    try {
      await debtsAPI.applyForgiveness(forgivenessLoan.id, amount, "system", reason);
      dialogs.success("Forgiveness applied successfully");
      reload();
      fetchStats();
      setForgivenessDialogOpen(false);
      setForgivenessLoan(null);
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setForgivenessLoading(false);
    }
  };

  const openPaymentModal = (loan: any) => {
    setSelectedLoan(loan);
    setPaymentModalOpen(true);
  };

  const openViewModal = (loan: any) => {
    setSelectedLoan(loan);
    setViewModalOpen(true);
  };

  const openEditModal = (loan: any) => {
    setSelectedLoan(loan);
    setEditModalOpen(true);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await debtsAPI.export("csv", {
        status: "active",
        search: filters.search || undefined,
        dueDateFrom: filters.dueDateFrom || undefined,
        dueDateTo: filters.dueDateTo || undefined,
        limit: 10000,
      });
      if (response.status && response.data?.data) {
        const blob = new Blob([response.data.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename || `active_loans_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess("Export completed");
      }
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLoans.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedLoans.length} loans? This action can be reversed.`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedLoans.map((id) => debtsAPI.delete(id)));
      dialogs.success(`${selectedLoans.length} loans deleted`);
      reload();
      fetchStats();
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-[var(--primary-color)]" />
            Active Loans
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage active loans, record payments, and track balances
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
            onClick={handleExport}
            disabled={exporting || loans.length === 0}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Export"
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
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && stats && (
        <LoanSummaryCards
          total={stats.totalActive}
          totalAmount={stats.totalAmountOwed}
          overdue={stats.totalOverdue}
          totalRemaining={stats.totalRemainingBalance}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search by debt or borrower..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <input
              type="date"
              value={filters.dueDateFrom}
              onChange={(e) => handleFilterChange("dueDateFrom", e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
              placeholder="Due date from"
            />
            <input
              type="date"
              value={filters.dueDateTo}
              onChange={(e) => handleFilterChange("dueDateTo", e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
              placeholder="Due date to"
            />
            <input
              type="number"
              placeholder="Min remaining amount"
              value={filters.minRemainingAmount || ""}
              onChange={(e) => handleFilterChange("minRemainingAmount", parseFloat(e.target.value) || 0)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedLoans.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedLoans.length}
          onDelete={handleBulkDelete}
          onClearSelection={() => toggleSelectAll()}
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
          <ActiveLoansTable
            loans={loans}
            selectedLoans={selectedLoans}
            onToggleSelect={toggleLoanSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={openViewModal}
            onEdit={openEditModal}
            onForgiveness={handleForgiveness}
            onRecordPayment={openPaymentModal}
            onViewSchedule={handleSchedule}
            onViewAgreement={handleViewAgreement}
          />

          {loans.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <HandCoins className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No active loans found</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hasFilters ? "Try adjusting your filters" : "All debts are either paid or overdue"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <RecordPaymentModal
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
      <ViewDebtModal
        isOpen={viewModalOpen}
        debt={selectedLoan}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedLoan(null);
        }}
      />
      <EditDebtModal
        isOpen={editModalOpen}
        debt={selectedLoan}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={() => {
          reload();
          fetchStats();
        }}
      />
      {forgivenessLoan && (
        <ForgivenessDialog
          isOpen={forgivenessDialogOpen}
          remainingBalance={forgivenessLoan.remainingAmount}
          onClose={() => {
            setForgivenessDialogOpen(false);
            setForgivenessLoan(null);
          }}
          onConfirm={handleForgivenessConfirm}
          isLoading={forgivenessLoading}
        />
      )}
      <ViewLoanAgreementModal
        isOpen={agreementModalOpen}
        debtId={selectedDebtForAgreement?.id ?? null}
        debtName={selectedDebtForAgreement?.name ?? ""}
        onClose={() => {
          setAgreementModalOpen(false);
          setSelectedDebtForAgreement(null);
        }}
      />
      <PaymentScheduleModal
        isOpen={scheduleModalOpen}
        debt={scheduleLoan}
        onClose={() => {
          setScheduleModalOpen(false);
          setScheduleLoan(null);
        }}
      />
    </div>
  );
};

export default ActiveLoansPage;