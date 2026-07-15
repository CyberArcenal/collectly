// src/renderer/pages/reports/expected/index.tsx
import React, { useState } from "react";
import { Calendar, RefreshCw, Eye, EyeOff } from "lucide-react";
import useExpectedPayments from "./hooks/useExpectedPayments";
import FilterBar from "./components/FilterBar";
import ExpectedChart from "./components/ExpectedChart";
import ExpectedTable from "./components/ExpectedTable";
import ExportButton from "./components/ExportButton";
import DetailsModal from "./components/DetailsModal";
import type { ExpectedPayment } from "./types";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import ExpectedSummaryCards from "./components/ExpectedSummaryCards";

const ExpectedPaymentsPage: React.FC = () => {
  const {
    loading,
    error,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    groupBy,
    setGroupBy,
    selectedGroupId,
    setSelectedGroupId,
    expectedData,
    refresh,
  } = useExpectedPayments();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDetails, setModalDetails] = useState<ExpectedPayment["details"]>([]);
  const [showStats, setShowStats] = useState(true);

  const handleRowClick = (details: ExpectedPayment["details"], period: string) => {
    setModalTitle(period);
    setModalDetails(details);
    setModalOpen(true);
  };

  if (error) {
    return (
      <div className="p-4">
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
      </div>
    );
  }

  const hasFilters = !!(fromDate && toDate);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--primary-color)]" />
            Expected Payments
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Forecast upcoming payments based on active debts
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
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {expectedData && <ExportButton report={expectedData} />}
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && expectedData && (
        <ExpectedSummaryCards
          totalExpected={expectedData.totalExpected}
          totalDebtors={expectedData.data.reduce((sum, d) => sum + d.debtorCount, 0)}
          totalDebts={expectedData.data.reduce((sum, d) => sum + d.debtCount, 0)}
          periodCount={expectedData.data.length}
        />
      )}

      {/* Filter */}
      <FilterBar
        fromDate={fromDate}
        toDate={toDate}
        groupBy={groupBy}
        selectedGroupId={selectedGroupId}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onGroupByChange={setGroupBy}
        onGroupIdChange={setSelectedGroupId}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !expectedData && (
        <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p>No expected payments in the selected period</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {hasFilters ? "Try adjusting your date range" : "Select a date range to see forecast"}
          </p>
        </div>
      )}

      {/* Content */}
      {expectedData && (
        <>
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
            <ExpectedChart report={expectedData} />
          </div>
          <ExpectedTable report={expectedData} onRowClick={handleRowClick} />
        </>
      )}

      {/* Modal */}
      <DetailsModal
        isOpen={modalOpen}
        title={modalTitle}
        details={modalDetails}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default ExpectedPaymentsPage;