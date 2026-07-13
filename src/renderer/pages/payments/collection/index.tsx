// src/renderer/pages/payments/collection/index.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Download, RefreshCw, Wrench, Eye, EyeOff, Filter } from "lucide-react";
import useCollectionSchedule from "./hooks/useCollectionSchedule";
import PeriodTabs from "./components/PeriodTabs";
import CollectionSummary from "./components/CollectionSummary";
import CollectionTable from "./components/CollectionTable";
import RecordPeriodPaymentModal from "./components/RecordPeriodPaymentModal";
import ExportModal from "./components/ExportModal";
import type { DebtorCollection } from "./types";
import { usePagination } from "../../../contexts/PaginationContext";
import { dialogs } from "../../../utils/dialogs";
import debtsAPI from "../../../api/core/debt";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

const CollectionPage: React.FC = () => {
  const {
    data,
    paginatedDebtors,
    loading,
    error,
    periodType,
    setPeriodType,
    refresh,
    page,
    setPage,
    limit,
    setLimit,
    pagination,
  } = useCollectionSchedule();

  const { setPagination, clearPagination } = usePagination();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<DebtorCollection | null>(
    null,
  );
  const [showStats, setShowStats] = useState(true);

  // Stable pagination handlers
  const handlePageChange = useCallback(
    (newPage: number) => setPage(newPage),
    [setPage],
  );
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setLimit(newSize);
      setPage(1);
    },
    [setLimit, setPage],
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

  const prevPageRef = useRef(page);
  const prevTotalRef = useRef(pagination.totalItems);
  const prevLimitRef = useRef(limit);

  // Sync with global pagination context
  useEffect(() => {
    const pageChanged = prevPageRef.current !== page;
    const totalChanged = prevTotalRef.current !== pagination.totalItems;
    const limitChanged = prevLimitRef.current !== limit;

    if (pageChanged || totalChanged || limitChanged) {
      prevPageRef.current = page;
      prevTotalRef.current = pagination.totalItems;
      prevLimitRef.current = limit;

      setPagination({
        currentPage: page,
        totalItems: pagination.totalItems,
        pageSize: limit,
        onPageChange: handlersRef.current.onPageChange,
        onPageSizeChange: handlersRef.current.onPageSizeChange,
        pageSizeOptions: [10, 25, 50, 100],
        showPageSize: true,
      });
    }
  }, [page, pagination.totalItems, limit, setPagination]);

  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  const handleMarkPaid = (debtor: DebtorCollection) => {
    setSelectedDebtor(debtor);
    setPaymentModalOpen(true);
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const handleFixPrecision = async () => {
    const confirm = await dialogs.confirm({
      message:
        "This will round all debt amounts to 2 decimal places. Continue?",
      title: "Fix Floating Point Precision",
    });
    if (confirm) {
      try {
        const result = await debtsAPI.fixPrecision();
        dialogs.success(`Fixed ${result.data.fixed} debts`);
        refresh();
      } catch (err: any) {
        dialogs.error(err.message);
      }
    }
  };

  // Display range
  const getDisplayRange = () => {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, pagination.totalItems);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--primary-color)]" />
            Collection Schedule
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Track and manage periodic collections from debtors
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
            onClick={handleFixPrecision}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title="Fix Floating Point Precision"
          >
            <Wrench className="w-4 h-4" />
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={!data || data.debtors.length === 0}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Period Navigation */}
      <PeriodTabs
        value={periodType}
        onChange={setPeriodType}
        disabled={loading}
      />

      {/* Summary */}
      {showStats && data && (
        <CollectionSummary data={data} />
      )}

      {/* Page info and pagination controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--text-secondary)]">Show:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-primary)",
            }}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {pagination.totalItems > 0
            ? `Showing ${start} to ${end} of ${pagination.totalItems} debtors`
            : "No debtors"}
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
            onClick={refresh}
            className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <>
          {data.debtors.length > 0 ? (
            <CollectionTable
              debtors={paginatedDebtors}
              onMarkPaid={handleMarkPaid}
            />
          ) : (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No due payments for this period</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                All debtors have paid their {data.periodLabel.toLowerCase()} obligations.
              </p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <RecordPeriodPaymentModal
        isOpen={paymentModalOpen}
        debtor={selectedDebtor}
        periodType={periodType}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedDebtor(null);
        }}
        onSuccess={refresh}
      />

      <ExportModal
        isOpen={exportModalOpen}
        data={data}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
};

export default CollectionPage;