// src/renderer/pages/loans/applications/components/ApplicationCard.tsx
import React from "react";
import { Eye, CheckCircle, XCircle, Calendar, DollarSign, FileText, User, ChevronRight, Clock } from "lucide-react";
import type { LoanApplication } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ApplicationCardProps {
  application: LoanApplication;
  onView: (app: LoanApplication) => void;
  onApprove?: (app: LoanApplication) => void;
  onReject?: (app: LoanApplication) => void;
  showActions?: boolean;
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
  switch (status) {
    case "pending":
      return {
        bg: "bg-[var(--status-pending-bg)]",
        text: "text-[var(--status-pending-text)]",
        icon: <Clock className="w-3 h-3" />,
      };
    case "approved":
      return {
        bg: "bg-[var(--status-success-bg)]",
        text: "text-[var(--status-success-text)]",
        icon: <CheckCircle className="w-3 h-3" />,
      };
    case "rejected":
      return {
        bg: "bg-[var(--status-overdue-bg)]",
        text: "text-[var(--status-overdue-text)]",
        icon: <XCircle className="w-3 h-3" />,
      };
    default:
      return { bg: "bg-[var(--status-inactive-bg)]", text: "text-[var(--text-tertiary)]", icon: null };
  }
};

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onView,
  onApprove,
  onReject,
  showActions = true,
}) => {
  const status = getStatusBadge(application.status);

  return (
    <div
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onView(application)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {getInitials(application.debtorName)}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm text-[var(--text-primary)] truncate">
              {application.debtorName}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
              <User className="w-3 h-3" />
              <span>ID: #{application.debtorId || "—"}</span>
            </div>
          </div>
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-medium ${status.bg} ${status.text} flex-shrink-0`}>
          {status.icon}
          {application.status}
        </span>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
          <span className="font-semibold text-[var(--text-primary)]">
            {formatCurrency(application.requestedAmount)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
          <span className="text-[var(--text-secondary)] truncate">
            {application.purpose}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
          <span className="text-[var(--text-secondary)]">
            Due: {formatDate(application.proposedDueDate)}
          </span>
        </div>
        {application.interestRate != null && (
          <div className="text-xs text-[var(--text-tertiary)]">
            Interest: {application.interestRate}%
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-1">
        {showActions && application.status === "pending" && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.(application);
              }}
              className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--success-color)]"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject?.(application);
              }}
              className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--danger-color)]"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(application);
          }}
          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--accent-blue)]"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default ApplicationCard;