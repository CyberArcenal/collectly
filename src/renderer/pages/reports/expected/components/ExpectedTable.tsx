// src/renderer/pages/reports/expected/components/ExpectedTable.tsx
import React from "react";
import { ChevronRight, Users, FileText } from "lucide-react";
import type { ExpectedReport, ExpectedPayment } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface ExpectedTableProps {
  report: ExpectedReport;
  onRowClick?: (details: ExpectedPayment["details"], period: string) => void;
}

const ExpectedTable: React.FC<ExpectedTableProps> = ({ report, onRowClick }) => {
  const periodLabel = report.groupBy === "day" ? "Date" : report.groupBy === "week" ? "Week" : "Month";

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              {periodLabel}
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Expected Amount
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Debtors
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Debts
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {report.data.map((item) => (
            <tr
              key={item.date}
              className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
              onClick={() => onRowClick?.(item.details, item.date)}
            >
              <td className="py-2.5 px-3 text-[var(--text-primary)] font-medium">
                {item.date}
              </td>
              <td className="py-2.5 px-3 text-right font-semibold" style={{ color: "var(--debt-high)" }}>
                {formatCurrency(item.amount)}
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className="inline-flex items-center gap-1 text-[var(--text-primary)]">
                  <Users className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  {item.debtorCount}
                </span>
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className="inline-flex items-center gap-1 text-[var(--text-primary)]">
                  <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  {item.debtCount}
                </span>
              </td>
              <td className="py-2.5 px-3 text-center">
                <button
                  onClick={(e) => { e.stopPropagation(); onRowClick?.(item.details, item.date); }}
                  className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                  style={{ color: "var(--accent-blue)" }}
                >
                  View
                  <ChevronRight className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-[var(--card-secondary-bg)] border-t border-[var(--border-color)] font-semibold">
          <tr>
            <td className="py-2.5 px-3 text-[var(--text-primary)]">Total</td>
            <td className="py-2.5 px-3 text-right" style={{ color: "var(--debt-high)" }}>
              {formatCurrency(report.totalExpected)}
            </td>
            <td className="py-2.5 px-3 text-center text-[var(--text-primary)]">-</td>
            <td className="py-2.5 px-3 text-center text-[var(--text-primary)]">-</td>
            <td className="py-2.5 px-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ExpectedTable;