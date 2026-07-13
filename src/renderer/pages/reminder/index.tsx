// src/renderer/pages/notification/index.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Filter, RefreshCw, Mail, Eye, EyeOff, Download } from "lucide-react";
import { dialogs } from "../../utils/dialogs";
import reminderLogAPI from "../../api/core/reminder_log";
import { showSuccess, showError } from "../../utils/notification";
import type { NotificationLogEntry } from "../../api/core/reminder_log";
import { useNotificationLogs } from "./hooks/useNotificationLogs";
import { NotificationStats } from "./components/reminderStats";
import { NotificationSearch } from "./components/reminderSearch";
import { NotificationFilterPanel } from "./components/reminderFilterPannel";
import { NotificationTable } from "./components/reminderTable";
import { NotificationViewDialog } from "./components/reminderViewDialogs";
import { usePagination } from "../../contexts/PaginationContext";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import Button from "../../components/UI/Button";

const NotificationLogPage: React.FC = () => {
  const {
    logs,
    totalItems,
    stats,
    loading,
    error,
    filters,
    currentPage,
    pageSize,
    updateFilters,
    clearFilters,
    setCurrentPage,
    setPageSize,
    refetch,
  } = useNotificationLogs();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<NotificationLogEntry | null>(null);
  const [sendingRows, setSendingRows] = useState<Set<number>>(new Set());
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { setPagination, clearPagination } = usePagination();

  const hasFilters = !!(
    searchQuery ||
    filters.status ||
    filters.startDate ||
    filters.endDate
  );

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

  // Handlers
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateFilters({ keyword: query });
  };

  const handleFilterChange = (newFilters: any) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    clearFilters();
  };

  const handleView = (log: NotificationLogEntry) => {
    setSelectedLog(log);
    setIsViewDialogOpen(true);
  };

  const handleRetry = async (id: number) => {
    setSendingRows((prev) => new Set(prev).add(id));
    try {
      const response = await reminderLogAPI.retry(id);
      if (response.status) {
        showSuccess("Email reminder queued for retry.");
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError("Retry failed", err.message || "Unable to retry email");
    } finally {
      setSendingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmRetry = (id: number) => {
    dialogs
      .confirm({
        title: "Retry Email Reminder",
        message: "Are you sure you want to retry sending this email?",
        confirmText: "Retry",
        cancelText: "Cancel",
        icon: "warning",
      })
      .then((confirmed) => {
        if (confirmed) handleRetry(id);
      });
  };

  const handleResend = async (id: number) => {
    setSendingRows((prev) => new Set(prev).add(id));
    try {
      const response = await reminderLogAPI.resend(id);
      if (response.status) {
        showSuccess("Email reminder resent.");
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError("Resend failed", err.message || "Unable to resend email");
    } finally {
      setSendingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmResend = (id: number) => {
    dialogs
      .confirm({
        title: "Resend Email Reminder",
        message: "Are you sure you want to resend this email?",
        confirmText: "Resend",
        cancelText: "Cancel",
        icon: "info",
      })
      .then((confirmed) => {
        if (confirmed) handleResend(id);
      });
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await reminderLogAPI.delete(id);
      if (response.status) {
        dialogs.success("Deleted", `Email log #${id} has been deleted.`);
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error("Delete failed", err.message);
    }
  };

  const confirmDelete = (id: number) => {
    dialogs
      .delete()
      .then((confirmed) => {
        if (confirmed) handleDelete(id);
      });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--primary-color)]" />
            Email Reminder Logs
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Track all email reminders sent to debtors
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
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title={isFilterOpen ? "Hide filters" : "Show filters"}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && <NotificationStats stats={stats} loading={loading} />}

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <NotificationSearch
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by recipient email, subject, or content..."
        />
        {searchQuery && (
          <span className="text-xs text-[var(--text-tertiary)]">
            Searching: “{searchQuery}”
          </span>
        )}
        {hasFilters && (
          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]" />
            Filters active
          </span>
        )}
      </div>

      {/* Filters Panel */}
      <NotificationFilterPanel
        filters={{
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        }}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
      />

      {/* Error */}
      {error && (
        <div
          className="p-3 rounded-lg text-sm flex items-center justify-between"
          style={{
            backgroundColor: "var(--status-overdue-bg)",
            color: "var(--danger-color)",
            border: "1px solid var(--danger-color)",
          }}
        >
          <span>Error: {error}</span>
          <button
            onClick={refetch}
            className="px-3 py-1 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading / Empty State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
          <Mail className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p>No email records found</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {hasFilters || searchQuery ? "Try adjusting your filters" : "Email reminders will appear here when sent"}
          </p>
        </div>
      ) : (
        <NotificationTable
          logs={logs}
          onView={handleView}
          onRetry={confirmRetry}
          onResend={confirmResend}
          onDelete={confirmDelete}
          isLoading={loading}
          sendingIds={sendingRows}
        />
      )}

      {/* View Dialog */}
      {selectedLog && (
        <NotificationViewDialog
          log={selectedLog}
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

export default NotificationLogPage;