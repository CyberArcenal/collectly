// src/renderer/pages/audit/index.tsx
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuditLogs, type AuditFilters } from "./hooks/useAuditLogs";
import { useAuditView } from "./hooks/useAuditView";
import { SummaryCards } from "./components/SummaryCards";
import { FilterBar } from "./components/FilterBar";
import { AuditTable } from "./components/AuditTable";
import { AuditViewDialog } from "./components/AuditViewDialog";
import { usePagination } from "../../contexts/PaginationContext";

const AuditTrailPage: React.FC = () => {
  const { logs, filters, setFilters, loading, error, reload, summary } =
    useAuditLogs({
      action: "all",
      startDate: undefined,
      endDate: undefined,
      search: "",
      entity: undefined,
      user: undefined,
    });

  const viewDialog = useAuditView();
  const { setPagination, clearPagination } = usePagination();

  // Local state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Memoize paginated logs
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return logs.slice(start, end);
  }, [logs, currentPage, pageSize]);

  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Handlers for global pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Sync with global pagination context
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
        pageSizeOptions: [10, 20, 50, 100],
        showPageSize: true,
      });
    }
  }, [currentPage, totalItems, pageSize, setPagination]);

  // Clear pagination on unmount
  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  // When filters change, reset to page 1
  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--card-bg)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Audit Trail
        </h1>
      </div>

      {/* Summary Cards */}
      {!loading && !error && <SummaryCards summary={summary} />}

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReload={reload}
      />

      {/* Main Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">
              Error loading audit logs
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">{error}</p>
            <button
              onClick={reload}
              className="mt-4 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <AuditTable logs={paginatedLogs} onView={viewDialog.open} />
        </div>
      )}

      {/* View Dialog */}
      <AuditViewDialog
        isOpen={viewDialog.isOpen}
        log={viewDialog.log}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default AuditTrailPage;