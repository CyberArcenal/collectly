// src/renderer/pages/audit/index.tsx
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { 
  RefreshCw, 
  Filter, 
  EyeOff, 
  Eye,
  Download,
  X
} from "lucide-react";
import { useAuditLogs, type AuditFilters } from "./hooks/useAuditLogs";
import { useAuditView } from "./hooks/useAuditView";
import { SummaryCards } from "./components/SummaryCards";
import { FilterBar } from "./components/FilterBar";
import { AuditTable } from "./components/AuditTable";
import { AuditViewDialog } from "./components/AuditViewDialog";
import { usePagination } from "../../contexts/PaginationContext";
import Button from "../../components/UI/Button";
import auditAPI from "../../api/core/audit";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";

const AuditTrailPage: React.FC = () => {
  const { logs, filters, setFilters, loading, error, reload, summary, stats } =
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

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Memoize paginated logs
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return logs.slice(start, end);
  }, [logs, currentPage, pageSize]);

  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Handlers
  const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      action: "all",
      startDate: undefined,
      endDate: undefined,
      search: "",
      entity: undefined,
      user: undefined,
    });
    setCurrentPage(1);
  };

  const hasFilters = !!(
    filters.search ||
    filters.entity ||
    filters.user ||
    (filters.action && filters.action !== "all") ||
    filters.startDate ||
    filters.endDate
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await auditAPI.exportCSV({
        searchTerm: filters.search || undefined,
        entity: filters.entity || undefined,
        user: filters.user || undefined,
        action: filters.action !== "all" ? filters.action : undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: 10000,
      });
      if (response.status && response.data?.filePath) {
        // Open the file or show a success message
        console.log("Export saved to:", response.data.filePath);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  // Pagination context sync
  const handlersRef = useRef({ onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
  useEffect(() => {
    handlersRef.current = { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange };
  }, [handlePageChange, handlePageSizeChange]);

  useEffect(() => {
    setPagination({
      currentPage,
      totalItems,
      pageSize,
      onPageChange: handlersRef.current.onPageChange,
      onPageSizeChange: handlersRef.current.onPageSizeChange,
      pageSizeOptions: [10, 20, 50, 100],
      showPageSize: true,
    });
    return () => clearPagination();
  }, [currentPage, totalItems, pageSize, setPagination, clearPagination]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Audit Trail
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Track all system activities and changes
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
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExport}
            disabled={exporting || logs.length === 0}
          >
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && stats && (
        <SummaryCards stats={stats} summary={summary} />
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
            onReload={reload}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      ) : (
        <AuditTable
          logs={paginatedLogs}
          onView={viewDialog.open}
          loading={loading}
        />
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