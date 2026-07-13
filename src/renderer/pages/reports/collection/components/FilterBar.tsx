// src/renderer/pages/reports/collection/components/FilterBar.tsx
import React from "react";
import { Calendar, Target, RefreshCw } from "lucide-react";

interface FilterBarProps {
  fromDate: string;
  toDate: string;
  target: number;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onTargetChange: (target: number) => void;
  onRefresh: () => void;
  loading: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  fromDate,
  toDate,
  target,
  onFromDateChange,
  onToDateChange,
  onTargetChange,
  onRefresh,
  loading,
}) => {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[140px]">
        <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
          <Calendar className="w-3 h-3 inline mr-1" />
          From Date
        </label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
          <Calendar className="w-3 h-3 inline mr-1" />
          To Date
        </label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
          <Target className="w-3 h-3 inline mr-1" />
          Expected Target (₱)
        </label>
        <input
          type="number"
          step="1000"
          value={target}
          onChange={(e) => onTargetChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
        style={{ backgroundColor: "var(--primary-color)" }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = "var(--primary-hover)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--primary-color)";
        }}
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
};

export default FilterBar;