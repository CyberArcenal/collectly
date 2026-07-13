// src/renderer/pages/payments/transactions/index.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Receipt, RefreshCw, Filter, Download, Eye, EyeOff, X } from "lucide-react";
import useTransactions from "./hooks/useTransactions";
import FilterBar from "./components/FilterBar";
import TransactionsTable from "./components/TransactionsTable";
import EditTransactionModal from "./components/EditTransactionModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import { formatCurrency } from "../../../utils/formatters";
import { dialogs } from "../../../utils/dialogs";
import paymentsAPI from "../../../api/core/payment_transaction";
import PaymentViewDialog from "./components/PaymentViewDialog";
import { usePagination } from "../../../contexts/PaginationContext";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import Button from "../../../components/UI/Button";
import TransactionSummaryCards from "./components/TransactionSummaryCards";

const IS_ADMIN = true;

const TransactionsPage: React.FC = () => {
  const {
    transactions,
    filters,
    loading,
    error,
    totalItems,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    handleSort,
    sortConfig,
    totalAmount,
    updateTransaction,
    deleteTransaction,
    stats,
    fetchStats,
  } = useTransactions();

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [deletingTx, setDeletingTx] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewingTx, setViewingTx] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { setPagination, clearPagination } = usePagination();

  const hasFilters = !!(
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.debtorId ||
    filters.debtId ||
    filters.minAmount > 0 ||
    filters.maxAmount > 0
  );

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

  const handlersRef = useRef({ onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
  useEffect(() => {
    handlersRef.current = { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange };
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

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: any = { ...filters };
      if (exportFilters.debtorId === "") delete exportFilters.debtorId;
      if (exportFilters.debtId === "") delete exportFilters.debtId;
      if (exportFilters.dateFrom) exportFilters.paymentDateFrom = exportFilters.dateFrom;
      if (exportFilters.dateTo) exportFilters.paymentDateTo = exportFilters.dateTo;
      if (exportFilters.minAmount > 0) exportFilters.minAmount = exportFilters.minAmount;
      if (exportFilters.maxAmount > 0) exportFilters.maxAmount = exportFilters.maxAmount;
      if (exportFilters.search) exportFilters.search = exportFilters.search;
      delete exportFilters.dateFrom;
      delete exportFilters.dateTo;

      const response = await paymentsAPI.export("csv", exportFilters);
      if (response.status) {
        const blob = new Blob([response.data.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename || `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
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

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return;
    setDeleteLoading(true);
    try {
      await deleteTransaction(deletingTx.id);
      dialogs.success("Transaction deleted");
      setDeletingTx(null);
      fetchStats();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleView = (tx: any) => {
    setViewingTx(tx);
    setViewOpen(true);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[var(--primary-color)]" />
            Transaction Log
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            View and manage all payment transactions
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
            onClick={reload}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || totalItems === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: "var(--success-color)" }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = "var(--btn-success-hover)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--success-color)";
            }}
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && stats && (
        <TransactionSummaryCards
          totalTransactions={stats.total}
          totalAmount={stats.totalAmount}
          averageAmount={stats.averageAmount}
          uniqueDebtors={stats.uniqueDebtors}
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
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
          />
        </div>
      )}

      {/* Page info and pagination controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--text-secondary)]">Show:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
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
            ? `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} transactions`
            : "No transactions"}
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
            onClick={reload}
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
          <TransactionsTable
            transactions={transactions}
            onSort={handleSort}
            sortConfig={sortConfig}
            isAdmin={IS_ADMIN}
            onEdit={(tx) => setEditingTx(tx)}
            onDelete={(tx) => setDeletingTx(tx)}
            onView={handleView}
          />
          {transactions.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No transactions found</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hasFilters ? "Try adjusting your filters" : "Payments will appear here when recorded"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <EditTransactionModal
        isOpen={!!editingTx}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onSave={updateTransaction}
      />
      <DeleteConfirmationModal
        isOpen={!!deletingTx}
        transaction={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
      <PaymentViewDialog
        transaction={viewingTx}
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
};

export default TransactionsPage;