// src/renderer/pages/debtors/components/DebtorTable.tsx
import React from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import type { DebtorWithTotal } from "../hooks/useDebtors";
import { formatCurrency } from "../../../utils/formatters";

interface DebtorTableProps {
  debtors: DebtorWithTotal[];
  selectedDebtors: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (debtor: DebtorWithTotal) => void;
  onEdit: (debtor: DebtorWithTotal) => void;
  onDelete: (debtor: DebtorWithTotal) => void;
  onRestore?: (debtor: DebtorWithTotal) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const DebtorTable: React.FC<DebtorTableProps> = ({
  debtors,
  selectedDebtors,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onEdit,
  onDelete,
  onRestore,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    );
  };

  const allSelected = debtors.length > 0 && selectedDebtors.length === debtors.length;
  const someSelected = selectedDebtors.length > 0 && !allSelected;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="py-2.5 px-3 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={onToggleSelectAll}
                className="rounded border-[var(--border-color)] cursor-pointer"
              />
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center gap-1">
                Name {getSortIcon("name")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("contact")}
            >
              <div className="flex items-center gap-1">
                Contact {getSortIcon("contact")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("email")}
            >
              <div className="flex items-center gap-1">
                Email {getSortIcon("email")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("total_debt")}
            >
              <div className="flex items-center gap-1">
                Total Debt {getSortIcon("total_debt")}
              </div>
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Status
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {debtors.map((debtor) => {
            const isDeleted = !!debtor.deletedAt;
            return (
              <tr
                key={debtor.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
                onClick={() => onView(debtor)}
              >
                <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedDebtors.includes(debtor.id)}
                    onChange={() => onToggleSelect(debtor.id)}
                    className="rounded border-[var(--border-color)] cursor-pointer"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-xs font-medium">
                      {getInitials(debtor.name)}
                    </div>
                    <div>
                      <div className="text-[var(--text-primary)] font-medium text-sm">
                        {debtor.name}
                      </div>
                      {debtor.address && (
                        <div className="flex items-center gap-0.5 text-[var(--text-tertiary)] text-[10px]">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[100px]">{debtor.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 text-[var(--text-secondary)] text-sm">
                    <Phone className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span>{debtor.contact || "—"}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 text-[var(--text-secondary)] text-sm">
                    <Mail className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className="truncate max-w-[120px]">{debtor.email || "—"}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="font-semibold text-sm" style={{ color: "var(--debt-high)" }}>
                    {formatCurrency(debtor.total_debt || 0)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {isDeleted ? (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)]">
                      Deleted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--status-success-bg)] text-[var(--status-success-text)]">
                      Active
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onView(debtor)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
                    </button>
                    {!isDeleted ? (
                      <>
                        <button
                          onClick={() => onEdit(debtor)}
                          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-yellow-500" />
                        </button>
                        <button
                          onClick={() => onDelete(debtor)}
                          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-[var(--danger-color)]" />
                        </button>
                      </>
                    ) : (
                      onRestore && (
                        <button
                          onClick={() => onRestore(debtor)}
                          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                          title="Restore"
                        >
                          <RefreshCw className="w-4 h-4 text-[var(--success-color)]" />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DebtorTable;