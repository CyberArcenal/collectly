// src/renderer/pages/reports/collection/index.tsx
import React, { useState } from "react";
import { BarChart3, RefreshCw, Eye, EyeOff } from "lucide-react";
import useCollectionReport from "./hooks/useCollectionReport";
import FilterBar from "./components/FilterBar";
import KPICards from "./components/KPICards";
import CollectionChart from "./components/CollectionChart";
import PaymentsTable from "./components/PaymentsTable";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

const CollectionReportPage: React.FC = () => {
  const { loading, error, period, target, report, updatePeriod, updateTarget, refresh } = useCollectionReport();
  const [showStats, setShowStats] = useState(true);

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

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--primary-color)]" />
            Collection Report
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Track actual vs expected collections over time
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
        </div>
      </div>

      {/* Filter */}
      <FilterBar
        fromDate={period.from}
        toDate={period.to}
        target={target}
        onFromDateChange={(date) => updatePeriod(date, period.to)}
        onToDateChange={(date) => updatePeriod(period.from, date)}
        onTargetChange={updateTarget}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {/* Content */}
      {!loading && report ? (
        <>
          {/* KPI Cards */}
          {showStats && (
            <KPICards
              totalActual={report.totalActual}
              totalExpected={report.totalExpected}
              collectionRate={report.collectionRate}
              averagePerDay={report.averagePerDay}
            />
          )}

          {/* Chart */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
            <CollectionChart data={report.dataPoints} />
          </div>

          {/* Table */}
          <PaymentsTable payments={report.paymentsByDebtor} />
        </>
      ) : (
        !loading && !report && (
          <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
            <p>No data available for the selected period</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Try adjusting your filters</p>
          </div>
        )
      )}
    </div>
  );
};

export default CollectionReportPage;