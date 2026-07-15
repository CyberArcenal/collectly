// src/renderer/pages/debtors/credit-check/components/CreditReportPreview.tsx
import React from "react";
import { FileText, Download, FileCheck, AlertCircle } from "lucide-react";
import type { CreditReport } from "../types";

interface CreditReportPreviewProps {
  report: CreditReport | null;
  onDownload: () => void;
}

const CreditReportPreview: React.FC<CreditReportPreviewProps> = ({ report, onDownload }) => {
  if (!report) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 text-center shadow-sm">
        <FileText className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)] opacity-50" />
        <p className="text-sm text-[var(--text-tertiary)]">
          Run a credit check to generate report
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[var(--success-color)]" />
          Credit Report
        </h3>
        <button
          onClick={onDownload}
          className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5"
          style={{
            backgroundColor: "var(--accent-blue)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent-blue-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent-blue)";
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-1 py-1.5 border-b border-[var(--border-color)]">
          <span className="text-[var(--text-secondary)]">Debtor</span>
          <span className="font-medium text-[var(--text-primary)]">{report.debtorName}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 py-1.5 border-b border-[var(--border-color)]">
          <span className="text-[var(--text-secondary)]">Credit Score</span>
          <span className={`font-bold ${report.score.score >= 700 ? "text-green-500" : report.score.score >= 500 ? "text-yellow-500" : "text-red-500"}`}>
            {report.score.score}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 py-1.5 border-b border-[var(--border-color)]">
          <span className="text-[var(--text-secondary)]">Risk Level</span>
          <span>{report.score.riskLevel}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 py-1.5 border-b border-[var(--border-color)]">
          <span className="text-[var(--text-secondary)]">Remarks</span>
          <span className="text-[var(--text-secondary)]">{report.score.remarks}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 py-1.5 border-b border-[var(--border-color)]">
          <span className="text-[var(--text-secondary)]">Payment History</span>
          <span className="text-[var(--text-secondary)]">{report.paymentHistory || "N/A"}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 py-1.5 border-b border-[var(--border-color)]">
          <span className="text-[var(--text-secondary)]">Outstanding Debts</span>
          <span className="font-medium">₱{report.outstandingDebts?.toLocaleString() || "0"}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 py-1.5 border-b border-[var(--border-color)]">
          <span className="text-[var(--text-secondary)]">Overdue Debts</span>
          <span className="font-medium">{report.overdueDebts || 0}</span>
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Recommendations
              </p>
              <p className="text-sm text-[var(--text-primary)]">{report.recommendations}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditReportPreview;