// src/renderer/pages/reports/aging/index.tsx
import React, { useState } from "react";
import { TrendingUp, RefreshCw, Download, Eye, EyeOff } from "lucide-react";
import useAgingAnalysis from "./hooks/useAgingAnalysis";
import AgingFilterBar from "./components/AgingFilterBar";
import AgingChart from "./components/AgingChart";
import AgingSummaryTable from "./components/AgingSummaryTable";
import BucketDrillDownModal from "./components/BucketDrillDownModal";
import ExportButton from "./components/ExportButton";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

const AgingAnalysisPage: React.FC = () => {
  const { loading, error, asOfDate, setAsOfDate, agingSummary, refresh } = useAgingAnalysis();
  const [selectedBucket, setSelectedBucket] = useState<{ range: string; totalAmount: number; count: number } | null>(null);
  const [showStats, setShowStats] = useState(true);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      </div>
    );
  }

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

  if (!agingSummary) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p>No active debts found</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Create debts to see aging analysis</p>
        </div>
      </div>
    );
  }

  const { buckets, totalOutstanding } = agingSummary;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--primary-color)]" />
            Aging Analysis
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Analyze outstanding debts by aging buckets
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
          <ExportButton summary={agingSummary} />
        </div>
      </div>

      {/* Summary Card */}
      {showStats && (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Total Outstanding
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                ₱{totalOutstanding?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="p-2 rounded-full bg-red-500 bg-opacity-10">
              <TrendingUp className="w-4 h-4 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <AgingFilterBar
        asOfDate={asOfDate}
        onAsOfDateChange={setAsOfDate}
        onRefresh={refresh}
      />

      {/* Chart */}
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
        <AgingChart buckets={buckets} />
      </div>

      {/* Table */}
      <AgingSummaryTable
        buckets={buckets}
        totalOutstanding={totalOutstanding}
        onBucketClick={(bucket) => setSelectedBucket(bucket)}
      />

      {/* Drill-down Modal */}
      <BucketDrillDownModal
        isOpen={!!selectedBucket}
        bucketRange={selectedBucket?.range || ""}
        asOfDate={asOfDate}
        onClose={() => setSelectedBucket(null)}
      />
    </div>
  );
};

export default AgingAnalysisPage;