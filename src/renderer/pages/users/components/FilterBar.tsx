// src/renderer/pages/users/components/FilterBar.tsx
import React from "react";
import { Search } from "lucide-react";
import type { UserFiltersLocal } from "../hooks/useUsers";

interface FilterBarProps {
  filters: UserFiltersLocal;
  onFilterChange: (key: keyof UserFiltersLocal, value: string) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  const userTypes = ["", "viewer", "customer", "staff", "collector", "manager", "admin"];
  const statuses = ["", "active", "restricted", "suspended", "deleted"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by name, email, or username..."
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

      {/* User Type */}
      <select
        value={filters.user_type}
        onChange={(e) => onFilterChange("user_type", e.target.value)}
        className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      >
        <option value="">All Types</option>
        {userTypes.slice(1).map(type => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>

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
        <option value="">All Status</option>
        {statuses.slice(1).map(status => (
          <option key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: "var(--primary-color)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--primary-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--primary-color)";
        }}
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterBar;