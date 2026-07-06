// src/renderer/pages/users/components/FilterBar.tsx
import React from "react";
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
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-md border mb-4"
      style={{
        backgroundColor: "var(--card-secondary-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
          Search
        </label>
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
          User Type
        </label>
        <select
          value={filters.user_type}
          onChange={(e) => onFilterChange("user_type", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="">All Types</option>
          {userTypes.slice(1).map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
          Status
        </label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="">All Status</option>
          {statuses.slice(1).map(status => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button
          onClick={onReset}
          className="w-full py-2 px-4 rounded-md transition-colors"
          style={{ backgroundColor: "var(--primary-color)", color: "white" }}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;