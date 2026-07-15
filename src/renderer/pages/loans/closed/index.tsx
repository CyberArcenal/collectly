// src/renderer/pages/loans/closed/index.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  CheckCircle,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  X,
  DollarSign,
  Download,
} from "lucide-react";
import useClosedLoans from "./hooks/useClosedLoans";
import ClosedLoansTable from "./components/ClosedLoansTable";
import ReopenConfirmationModal from "./components/ReopenConfirmationModal";
import ViewDebtModal from "../active/components/ViewDebtModal";
import { usePagination } from "../../../contexts/PaginationContext";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import { dialogs } from "../../../utils/dialogs";
import debtsAPI from "../../../api/core/debt";
import ClosedLoanSummaryCards from "./components/ClosedLoanSummaryCards";
import BulkActionsBar from "./components/BulkActionsBar";

const ClosedLoansPage: React.FC = () => {
  const {
    loans,
    loading,
    error,
    summary,
    totalItems,
    currentPage,
    pageSize,
    filters,
    setPageSize,
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
  } = useClosedLoans();

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const { setPagination, clearPagination } = usePagination();

  const hasFilters = !!(filters.search);

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
  const prevTotalRef = useRef(totalItems);
  const prevLimitRef = useRef(pageSize);

  useEffect(() => {
    const pageChanged = prevPageRef.current !== currentPage;
    const totalChanged = prevTotalRef.current !== totalItems;
    const limitChanged = prevLimitRef.current !== pageSize;

    if (pageChanged || totalChanged || limitChanged) {
      prevPageRef.current = currentPage;
      prevTotalRef.current = totalItems;
      prevLimitRef.current = pageSize;

      setPagination({
        currentPage,
        totalItems,
        pageSize,
        onPageChange: handlersRef.current.onPageChange,
        onPageSizeChange: handlersRef.current.onPageSizeChange,
        pageSizeOptions: [10, 25, 50, 100],
        showPageSize: true,
      });
    }
  }, [currentPage, totalItems, pageSize, setPagination]);

  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  const openViewModal = (loan: any) => {
    setSelectedLoan(loan);
    setViewModalOpen(true);
  };

  const openReopenModal = (loan: any) => {
    setSelectedLoan(loan);
    setReopenModalOpen(true);
  };

  const handleBulkReopen = async () => {
    if (selectedLoans.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Reopen",
      message: `Reopen ${selectedLoans.length} closed loan(s)? They will become active again.`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedLoans.map((id) => debtsAPI.update(id, { status: "active" })));
      dialogs.success(`${selectedLoans.length} loan(s) reopened`);
      setSelectedLoans([]);
      reload();
    } catch (err: any) {
      dialogs.error(err.message);
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
        "Total Amount",
        "Paid Amount",
        "Closed Date",
        "Last Payment",
      ];
      const rows = selected.map((l) => [
        l.id,
        l.name,
        l.borrower?.name || "",
        l.totalAmount,
        l.paidAmount,
        l.closedAt,
        l.lastPaymentDate || "",
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `closed_loans_${new Date().toISOString().slice(0, 19)}.csv`;
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
        status: "paid",
        search: filters.search || undefined,
        limit: 10000,
      });
      if (response.status && response.data?.data) {
        const csvData = typeof response.data.data === "string" ? response.data.data : JSON.stringify(response.data.data);
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename || `all_closed_loans_${new Date().toISOString().slice(0, 19)}.csv`;
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
            <CheckCircle className="w-5 h-5 text-[var(--success-color)]" />
            Closed Loans
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            View and manage fully paid / closed loans
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
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && (
        <ClosedLoanSummaryCards
          total={summary.totalCount}
          totalAmountPaid={summary.totalAmountPaid}
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
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedLoans.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedLoans.length}
          onReopen={handleBulkReopen}
          onExport={handleBulkExport}
          onClearSelection={() => setSelectedLoans([])}
          exporting={exporting}
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
          <ClosedLoansTable
            loans={loans}
            selectedLoans={selectedLoans}
            onToggleSelect={toggleLoanSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={openViewModal}
            onReopen={openReopenModal}
          />
          {loans.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No closed loans found</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hasFilters ? "Try adjusting your filters" : "Paid loans will appear here"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ViewDebtModal
        isOpen={viewModalOpen}
        debt={selectedLoan}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedLoan(null);
        }}
      />
      <ReopenConfirmationModal
        isOpen={reopenModalOpen}
        loan={selectedLoan}
        onClose={() => {
          setReopenModalOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={reload}
      />
    </div>
  );
};

export default ClosedLoansPage;