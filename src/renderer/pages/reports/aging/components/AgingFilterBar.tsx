// src/renderer/pages/reports/aging/components/AgingFilterBar.tsx
import React from "react";
import { Calendar, RefreshCw } from "lucide-react";

interface AgingFilterBarProps {
  asOfDate: string;
  onAsOfDateChange: (date: string) => void;
  onRefresh: () => void;
}

const AgingFilterBar: React.FC<AgingFilterBarProps> = ({
  asOfDate,
  onAsOfDateChange,
  onRefresh,
}) => {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
          <Calendar className="w-3 h-3 inline mr-1" />
          As of Date
        </label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => onAsOfDateChange(e.target.value)}
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
        className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5"
        style={{ backgroundColor: "var(--primary-color)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--primary-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--primary-color)";
        }}
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>
    </div>
  );
};

export default AgingFilterBar;