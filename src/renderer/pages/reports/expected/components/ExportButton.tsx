// src/renderer/pages/reports/expected/components/ExportButton.tsx
import React from "react";
import { Download } from "lucide-react";
import type { ExpectedReport } from "../types";
import { dialogs } from "../../../../utils/dialogs";

interface ExportButtonProps {
  report: ExpectedReport;
}

const ExportButton: React.FC<ExportButtonProps> = ({ report }) => {
  const handleExport = () => {
    const rows = [
      ["Expected Payments Report"],
      [`Period: ${report.period.from} to ${report.period.to}`],
      [`Grouped by: ${report.groupBy}`],
      [`Total Expected: ${report.totalExpected}`],
      [],
      ["Period", "Expected Amount", "Debtors", "Debts"],
    ];
    report.data.forEach(item => {
      rows.push([item.date, item.amount.toString(), item.debtorCount.toString(), item.debtCount.toString()]);
    });
    rows.push([], ["Detailed Breakdown"]);
    report.data.forEach(item => {
      rows.push([`${item.date} - Details:`]);
      rows.push(["Debt", "Debtor", "Amount"]);
      item.details.forEach(d => rows.push([d.debtName, d.debtorName, d.amount.toString()]));
      rows.push([]);
    });
    const csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expected_payments_${report.period.from}_to_${report.period.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    dialogs.success("Export completed");
  };

  return (
    <button
      onClick={handleExport}
      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5"
      style={{ backgroundColor: "var(--success-color)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--btn-success-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--success-color)";
      }}
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
};

export default ExportButton;