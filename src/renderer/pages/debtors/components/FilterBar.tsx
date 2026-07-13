// src/renderer/pages/debtors/components/FilterBar.tsx
import React from "react";
import { Search } from "lucide-react";
import type { DebtorFilters } from "../hooks/useDebtors";

interface FilterBarProps {
  filters: DebtorFilters;
  onFilterChange: (key: keyof DebtorFilters, value: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by name, email, or contact..."
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

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => onFilterChange("status", e.target.value)}
        className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      >
        <option value="active">Active</option>
        <option value="deleted">Deleted</option>
        <option value="all">All</option>
      </select>

      {/* Empty placeholder for alignment */}
      <div className="hidden lg:block" />
    </div>
  );
};

export default FilterBar;