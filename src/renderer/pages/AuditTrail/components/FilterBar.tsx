// src/renderer/pages/audit/components/FilterBar.tsx
import React from "react";
import { Search } from "lucide-react";
import type { AuditFilters } from "../hooks/useAuditLogs";

interface FilterBarProps {
  filters: AuditFilters;
  onFilterChange: (key: keyof AuditFilters, value: any) => void;
  onReload: () => void;
}

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "VIEW", label: "View" },
  { value: "EXPORT", label: "Export" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "AUDIT_CLEANUP", label: "Audit Cleanup" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search logs..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Action Type */}
      <select
        value={filters.action}
        onChange={(e) => onFilterChange("action", e.target.value)}
        className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      >
        {ACTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Entity */}
      <input
        type="text"
        placeholder="Entity (e.g., Debt, Borrower)"
        value={filters.entity || ""}
        onChange={(e) => onFilterChange("entity", e.target.value || undefined)}
        className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      />

      {/* User */}
      <input
        type="text"
        placeholder="Username"
        value={filters.user || ""}
        onChange={(e) => onFilterChange("user", e.target.value || undefined)}
        className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      />

      {/* Date Range */}
      <div className="flex items-center gap-2 col-span-2">
        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) => onFilterChange("startDate", e.target.value || undefined)}
          className="flex-1 px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
        <span className="text-[var(--text-tertiary)] text-sm">to</span>
        <input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) => onFilterChange("endDate", e.target.value || undefined)}
          className="flex-1 px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>
    </div>
  );
};