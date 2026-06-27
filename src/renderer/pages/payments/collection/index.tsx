// src/renderer/pages/payments/collection/index.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Download, RefreshCw, Wrench } from "lucide-react";
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
    <div className="m-1" style={{ backgroundColor: "var(--background-color)" }}>
      <div
        className="rounded-md shadow-md border p-4"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar
              className="w-6 h-6"
              style={{ color: "var(--primary-color)" }}
            />
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--sidebar-text)" }}
            >
              Collection Schedule
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFixPrecision}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Wrench className="w-4 h-4" />
              Fix Precision
            </button>
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!data || data.debtors.length === 0}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Period Navigation */}
        <div className="mb-4">
          <PeriodTabs
            value={periodType}
            onChange={setPeriodType}
            disabled={loading}
          />
        </div>

        {/* Loading / Error - centered like ActiveLoansPage */}
        {(loading || error) && (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            {loading && (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-color)]"></div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Loading collection schedule...
                </p>
              </div>
            )}
            {error && (
              <div className="text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-red-500">Error: {error}</p>
                <button
                  onClick={refresh}
                  className="mt-3 px-4 py-2 bg-[var(--primary-color)] text-white rounded-md text-sm"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <>
            {/* Summary */}
            <div className="mb-4">
              <CollectionSummary data={data} />
            </div>

            {/* Page info and pagination controls (inline) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <label
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Show:
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border-color)",
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
              <div
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {pagination.totalItems > 0
                  ? `Showing ${start} to ${end} of ${pagination.totalItems} debtors`
                  : "No debtors"}
              </div>
            </div>

            {/* Table */}
            {data.debtors.length > 0 ? (
              <CollectionTable
                debtors={paginatedDebtors}
                onMarkPaid={handleMarkPaid}
              />
            ) : (
              <div
                className="text-center py-12 border rounded-md"
                style={{ borderColor: "var(--border-color)" }}
              >
                <Calendar
                  className="w-12 h-12 mx-auto mb-3"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <p
                  className="text-lg font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  No due payments for this period
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  All debtors have paid their {data.periodLabel.toLowerCase()}{" "}
                  obligations.
                </p>
              </div>
            )}
          </>
        )}
      </div>

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
