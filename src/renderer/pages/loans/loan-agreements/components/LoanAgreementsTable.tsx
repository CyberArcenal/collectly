// src/renderer/pages/loans/agreements/components/LoanAgreementsTable.tsx
import React from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  FileSignature,
  Download,
  User,
  Calendar,
  CheckCircle,
  FileText,
} from "lucide-react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface LoanAgreementsTableProps {
  agreements: LoanAgreement[];
  selectedAgreements: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onView: (agreement: LoanAgreement) => void;
  onEdit: (agreement: LoanAgreement) => void;
  onSign: (agreement: LoanAgreement) => void;
  onDelete: (agreement: LoanAgreement) => void;
  onDownload: (agreement: LoanAgreement) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onSort: (key: string) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getStatusBadge = (status: string) => {
  if (status === "signed") {
    return {
      bg: "bg-[var(--status-success-bg)]",
      text: "text-[var(--status-success-text)]",
      icon: <CheckCircle className="w-3 h-3" />,
    };
  }
  return {
    bg: "bg-[var(--status-pending-bg)]",
    text: "text-[var(--status-pending-text)]",
    icon: <FileText className="w-3 h-3" />,
  };
};

const LoanAgreementsTable: React.FC<LoanAgreementsTableProps> = ({
  agreements,
  selectedAgreements,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onSign,
  onDelete,
  onDownload,
  sortConfig,
  onSort,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    );
  };

  const allSelected = agreements.length > 0 && selectedAgreements.length === agreements.length;
  const someSelected = selectedAgreements.length > 0 && !allSelected;

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
              onClick={() => onSort("agreementDate")}
            >
              <div className="flex items-center gap-1">
                Date {getSortIcon("agreementDate")}
              </div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("lenderName")}
            >
              <div className="flex items-center gap-1">
                Lender {getSortIcon("lenderName")}
              </div>
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Debt / Borrower
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Principal
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("status")}
            >
              <div className="flex items-center gap-1">
                Status {getSortIcon("status")}
              </div>
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Signed By
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {agreements.map((agreement) => {
            const status = getStatusBadge(agreement.status);
            const borrowerName = agreement.debt?.borrower?.name ?? "—";
            return (
              <tr
                key={agreement.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
                onClick={() => onView(agreement)}
              >
                <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedAgreements.includes(agreement.id)}
                    onChange={() => onToggleSelect(agreement.id)}
                    className="rounded border-[var(--border-color)] cursor-pointer"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                    {agreement.agreementDate ? formatDate(agreement.agreementDate) : "—"}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-medium text-[var(--text-primary)] text-sm">
                    {agreement.lenderName || "—"}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                      {borrowerName !== "—" ? getInitials(borrowerName) : "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[var(--text-primary)] text-sm truncate max-w-[120px]">
                        {agreement.debt?.name || "—"}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[120px]">
                        {borrowerName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  {agreement.principalAmount ? (
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatCurrency(agreement.principalAmount)}
                    </span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${status.bg} ${status.text}`}>
                    {status.icon}
                    {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {agreement.signedBy ? (
                    <div>
                      <div className="text-sm text-[var(--text-primary)]">{agreement.signedBy}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">
                        {agreement.signedAt ? formatDate(agreement.signedAt) : ""}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onView(agreement)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                    </button>
                    {agreement.status === "draft" && (
                      <>
                        <button
                          onClick={() => onEdit(agreement)}
                          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5 text-yellow-500" />
                        </button>
                        <button
                          onClick={() => onSign(agreement)}
                          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                          title="Sign"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-[var(--success-color)]" />
                        </button>
                      </>
                    )}
                    {agreement.filePath && (
                      <button
                        onClick={() => onDownload(agreement)}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(agreement)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[var(--danger-color)]" />
                    </button>
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

export default LoanAgreementsTable;