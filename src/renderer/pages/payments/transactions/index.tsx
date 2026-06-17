// src/renderer/pages/payments/transactions/index.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Receipt, RefreshCw, Filter, Download } from "lucide-react";
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
  } = useTransactions();

  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [deletingTx, setDeletingTx] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewingTx, setViewingTx] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { setPagination, clearPagination } = usePagination();

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
    <div className="m-1" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Transaction Log</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}>
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button onClick={reload} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={handleExport} disabled={exporting || totalItems === 0} className="px-3 py-2 rounded-md flex items-center gap-1" style={{ backgroundColor: "var(--success-color)", color: "white" }}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {showFilters && <FilterBar filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} />}

        <div className="mb-3 flex flex-wrap justify-between items-center gap-2">
          <div className="text-sm" style={{ color: "var(--text-primary)" }}>Total Amount (current page): <span className="font-bold" style={{ color: "var(--success-color)" }}>{formatCurrency(totalAmount)}</span></div>
          {/* Removed "Show:" dropdown and showing info – global pagination handles it */}
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>}
        {error && <div className="text-center py-4" style={{ color: "var(--danger-color)" }}>Error: {error}</div>}

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
              <div className="text-center py-8" style={{ color: "var(--text-secondary)" }}>No transactions found.</div>
            )}
          </>
        )}
      </div>

      <EditTransactionModal isOpen={!!editingTx} transaction={editingTx} onClose={() => setEditingTx(null)} onSave={updateTransaction} />
      <DeleteConfirmationModal isOpen={!!deletingTx} transaction={deletingTx} onClose={() => setDeletingTx(null)} onConfirm={handleDeleteConfirm} loading={deleteLoading} />
      <PaymentViewDialog transaction={viewingTx} isOpen={viewOpen} onClose={() => setViewOpen(false)} />
    </div>
  );
};

export default TransactionsPage;