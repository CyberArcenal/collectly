// src/renderer/pages/reports/debtor-stmt/components/StatementPrintable.tsx
import React from "react";
import type { StatementData } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface StatementPrintableProps {
  statement: StatementData;
  companyName: string;
}

const StatementPrintable: React.FC<StatementPrintableProps> = ({ statement, companyName }) => {
  return (
    <div
      id="statement-print-area"
      className="p-6 print:p-8"
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        backgroundColor: "var(--card-bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-6 border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{companyName}</h1>
        <p className="text-sm text-[var(--text-secondary)]">Debtor Statement of Account</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          As of {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Debtor Info */}
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
        <h2 className="font-semibold text-base text-[var(--text-primary)]">{statement.debtor.name}</h2>
        <div className="grid grid-cols-2 gap-1 text-sm mt-1">
          {statement.debtor.contact && (
            <div>
              <span className="text-[var(--text-tertiary)]">Contact:</span>
              <span className="ml-1 text-[var(--text-primary)]">{statement.debtor.contact}</span>
            </div>
          )}
          {statement.debtor.email && (
            <div>
              <span className="text-[var(--text-tertiary)]">Email:</span>
              <span className="ml-1 text-[var(--text-primary)]">{statement.debtor.email}</span>
            </div>
          )}
          {statement.debtor.address && (
            <div className="col-span-2">
              <span className="text-[var(--text-tertiary)]">Address:</span>
              <span className="ml-1 text-[var(--text-primary)]">{statement.debtor.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: "var(--accent-blue-light)" }}>
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Borrowed</div>
          <div className="font-bold text-sm" style={{ color: "var(--accent-blue)" }}>
            {formatCurrency(statement.summary.totalBorrowed)}
          </div>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: "var(--accent-green-light)" }}>
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Paid</div>
          <div className="font-bold text-sm" style={{ color: "var(--success-color)" }}>
            {formatCurrency(statement.summary.totalPaid)}
          </div>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: "var(--accent-red-light)" }}>
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Penalties</div>
          <div className="font-bold text-sm" style={{ color: "var(--danger-color)" }}>
            {formatCurrency(statement.summary.totalPenalties)}
          </div>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: "var(--accent-purple-light)" }}>
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Outstanding</div>
          <div className="font-bold text-sm" style={{ color: "var(--accent-purple)" }}>
            {formatCurrency(statement.summary.outstanding)}
          </div>
        </div>
      </div>

      {/* Debts Table */}
      <h3 className="font-semibold text-sm text-[var(--text-primary)] mt-4 mb-1.5">Loan Details</h3>
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <tr>
              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Debt Name</th>
              <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total</th>
              <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Paid</th>
              <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Remaining</th>
              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {statement.debts.map((d) => (
              <tr key={d.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                <td className="px-3 py-1 text-[var(--text-primary)]">{d.name}</td>
                <td className="px-3 py-1 text-right text-[var(--text-primary)]">{formatCurrency(d.totalAmount)}</td>
                <td className="px-3 py-1 text-right text-[var(--text-primary)]">{formatCurrency(d.paidAmount)}</td>
                <td className="px-3 py-1 text-right font-semibold" style={{ color: "var(--debt-high)" }}>
                  {formatCurrency(d.remainingAmount)}
                </td>
                <td className="px-3 py-1 text-[var(--text-primary)]">{formatDate(d.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payments Table */}
      <h3 className="font-semibold text-sm text-[var(--text-primary)] mt-4 mb-1.5">Payment History</h3>
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <tr>
              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Date</th>
              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Debt</th>
              <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Amount</th>
              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Reference</th>
            </tr>
          </thead>
          <tbody>
            {statement.payments.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                <td className="px-3 py-1 text-[var(--text-primary)]">{formatDate(p.paymentDate)}</td>
                <td className="px-3 py-1 text-[var(--text-primary)]">{p.debt?.name || "—"}</td>
                <td className="px-3 py-1 text-right font-medium text-[var(--success-color)]">
                  {formatCurrency(p.amount)}
                </td>
                <td className="px-3 py-1 text-[var(--text-primary)]">{p.reference || "—"}</td>
              </tr>
            ))}
            {statement.payments.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-2 text-[var(--text-tertiary)] text-xs">No payments recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Penalties Table */}
      <h3 className="font-semibold text-sm text-[var(--text-primary)] mt-4 mb-1.5">Penalties Incurred</h3>
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <tr>
              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Date</th>
              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Debt</th>
              <th className="px-3 py-1.5 text-right text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Amount</th>
              <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Reason</th>
            </tr>
          </thead>
          <tbody>
            {statement.penalties.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                <td className="px-3 py-1 text-[var(--text-primary)]">{formatDate(p.penaltyDate)}</td>
                <td className="px-3 py-1 text-[var(--text-primary)]">{p.debt?.name || "—"}</td>
                <td className="px-3 py-1 text-right text-[var(--danger-color)]">{formatCurrency(p.amount)}</td>
                <td className="px-3 py-1 text-[var(--text-primary)]">{p.reason || "—"}</td>
              </tr>
            ))}
            {statement.penalties.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-2 text-[var(--text-tertiary)] text-xs">No penalties recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] mt-6 pt-3 border-t" style={{ color: "var(--text-tertiary)", borderColor: "var(--border-color)" }}>
        Generated by Collectly • {new Date().toLocaleString()}
      </div>

      {/* Print styles – force black/white for printed version */}
      <style>{`
        @media print {
          body, #statement-print-area, * {
            background-color: white !important;
            color: black !important;
            border-color: #ccc !important;
          }
          .bg-blue-50, .bg-green-50, .bg-red-50, .bg-purple-50 {
            background-color: #f3f4f6 !important;
          }
          .text-green-600, .text-red-600 {
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StatementPrintable;