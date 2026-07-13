// src/renderer/pages/payments/transactions/components/FilterBar.tsx
import React from "react";
import { Search } from "lucide-react";
import type { TransactionFilters } from "../hooks/useTransactions";
import BorrowerSelect from "../../../../components/Selects/Borrower";
import DebtSelect from "../../../../components/Selects/Debt";
interface FilterBarProps {
  filters: TransactionFilters;
  onFilterChange: (key: keyof TransactionFilters, value: string | number) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by debtor, debt, or reference..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Date From */}
      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onFilterChange("dateFrom", e.target.value)}
        className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
        placeholder="From date"
      />

      {/* Date To */}
      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onFilterChange("dateTo", e.target.value)}
        className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
        placeholder="To date"
      />

      {/* Debtor Select */}
      <BorrowerSelect
        value={filters.debtorId === "" ? null : (filters.debtorId as number)}
        onChange={(id) => onFilterChange("debtorId", id === null ? "" : id)}
        placeholder="All Debtors"
        activeOnly={true}
      />

      {/* Debt Select */}
      <DebtSelect
        value={filters.debtId === "" ? null : (filters.debtId as number)}
        onChange={(id) => onFilterChange("debtId", id === null ? "" : id)}
        placeholder="All Debts"
        statusFilter="active"
      />

      {/* Min Amount */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] text-sm">₱</span>
        <input
          type="number"
          placeholder="Min amount"
          value={filters.minAmount || ""}
          onChange={(e) => onFilterChange("minAmount", parseFloat(e.target.value) || 0)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Max Amount */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] text-sm">₱</span>
        <input
          type="number"
          placeholder="Max amount"
          value={filters.maxAmount || ""}
          onChange={(e) => onFilterChange("maxAmount", parseFloat(e.target.value) || 0)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
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

export default FilterBar;