// src/renderer/pages/loans/closed/index.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle, RefreshCw, Filter, X, DollarSign } from "lucide-react";
import useClosedLoans from "./hooks/useClosedLoans";
import ClosedLoansTable from "./components/ClosedLoansTable";
import ReopenConfirmationModal from "./components/ReopenConfirmationModal";
import ViewDebtModal from "../active/components/ViewDebtModal";
import { formatCurrency } from "../../../utils/formatters";
import { usePagination } from "../../../contexts/PaginationContext";

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
  } = useClosedLoans();

  const [showFilters, setShowFilters] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const { setPagination, clearPagination } = usePagination();

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

  const handlersRef = useRef({ onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
  useEffect(() => {
    handlersRef.current = { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange };
  }, [handlePageChange, handlePageSizeChange]);

  const prevPageRef = useRef(currentPage);
  const prevTotalRef = useRef(totalItems);
  const prevLimitRef = useRef(pageSize);

  // Sync with global pagination context
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

  const openViewModal = (loan: any) => { setSelectedLoan(loan); setViewModalOpen(true); };
  const openReopenModal = (loan: any) => { setSelectedLoan(loan); setReopenModalOpen(true); };

  return (
    <div className="m-1" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" style={{ color: "var(--success-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Closed / Paid Loans</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)" }}><Filter className="w-4 h-4" /> Filters</button>
            <button onClick={reload} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)" }}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5" style={{ color: "var(--success-color)" }} /><span className="font-medium" style={{ color: "var(--text-primary)" }}>Total Closed Loans:</span> <span style={{ color: "var(--text-primary)" }}>{summary.totalCount}</span></div>
          <div className="flex items-center gap-2"><DollarSign className="w-5 h-5" style={{ color: "var(--success-color)" }} /><span className="font-medium" style={{ color: "var(--text-primary)" }}>Total Amount Paid:</span> <span className="font-bold" style={{ color: "var(--success-color)" }}>{formatCurrency(summary.totalAmountPaid)}</span></div>
        </div>

        {showFilters && (
          <div className="mb-4 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <div className="grid grid-cols-1 gap-3">
              <input type="text" placeholder="Search by debt or borrower" value={filters.search} onChange={(e) => handleFilterChange("search", e.target.value)} className="px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
            <div className="mt-2 flex justify-end"><button onClick={resetFilters} className="text-sm flex items-center gap-1" style={{ color: "var(--success-color)" }}><X className="w-3 h-3" /> Reset</button></div>
          </div>
        )}

        {/* Loading & Error states */}
        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>}
        {error && <div className="text-center py-4" style={{ color: "var(--danger-color)" }}>Error: {error}</div>}

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
              <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
                <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No closed loans found</p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>All active loans will appear here when paid.</p>
              </div>
            )}
          </>
        )}
      </div>

      <ViewDebtModal isOpen={viewModalOpen} debt={selectedLoan} onClose={() => { setViewModalOpen(false); setSelectedLoan(null); }} />
      <ReopenConfirmationModal isOpen={reopenModalOpen} loan={selectedLoan} onClose={() => { setReopenModalOpen(false); setSelectedLoan(null); }} onSuccess={reload} />
    </div>
  );
};

export default ClosedLoansPage;