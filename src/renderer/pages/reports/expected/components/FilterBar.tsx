// src/renderer/pages/reports/expected/components/FilterBar.tsx
import React from "react";
import { Calendar, Filter, RefreshCw, Users } from "lucide-react";
import GroupSelect from "../../../../components/Selects/Group";

interface FilterBarProps {
  fromDate: string;
  toDate: string;
  groupBy: "day" | "week" | "month";
  selectedGroupId: number | "all";
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onGroupByChange: (value: "day" | "week" | "month") => void;
  onGroupIdChange: (id: number | "all") => void;
  onRefresh: () => void;
  loading: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  fromDate,
  toDate,
  groupBy,
  selectedGroupId,
  onFromDateChange,
  onToDateChange,
  onGroupByChange,
  onGroupIdChange,
  onRefresh,
  loading,
}) => {
  const handleGroupChange = (groupId: number | null) => {
    onGroupIdChange(groupId === null ? "all" : groupId);
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm flex flex-wrap items-end gap-3">
      {/* From Date */}
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

      {/* To Date */}
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

      {/* Group By */}
      <div className="flex-1 min-w-[120px]">
        <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
          <Filter className="w-3 h-3 inline mr-1" />
          Group By
        </label>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as any)}
          className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>

      {/* Debtor Group */}
      <div className="flex-1 min-w-[140px]">
        <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
          <Users className="w-3 h-3 inline mr-1" />
          Debtor Group
        </label>
        <GroupSelect
          value={selectedGroupId === "all" ? null : selectedGroupId}
          onChange={handleGroupChange}
          placeholder="All Groups"
          className="w-full"
        />
      </div>

      {/* Refresh Button */}
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