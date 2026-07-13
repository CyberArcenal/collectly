// src/renderer/pages/reports/collection/components/PaymentsTable.tsx
import React from "react";
import { User, DollarSign, Calendar, CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface PaymentsTableProps {
  payments: Array<{
    debtorId: number;
    debtorName: string;
    totalPaid: number;
    transactionCount: number;
    lastPaymentDate: string;
  }>;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-4 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
        <CreditCard className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
        <p>No payments recorded in this period</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--card-secondary-bg)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--primary-color)]" />
          Payments by Debtor
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
            <tr>
              <th className="text-left py-2.5 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                Debtor
              </th>
              <th className="text-right py-2.5 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                Total Paid
              </th>
              <th className="text-center py-2.5 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                Transactions
              </th>
              <th className="text-left py-2.5 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                Last Payment
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p.debtorId}
                className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors"
              >
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                      {getInitials(p.debtorName)}
                    </div>
                    <span className="font-medium text-[var(--text-primary)] text-sm">
                      {p.debtorName}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-[var(--success-color)]">
                  {formatCurrency(p.totalPaid)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--card-secondary-bg)] text-[var(--text-primary)] text-xs font-medium">
                    {p.transactionCount}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                    {formatDate(p.lastPaymentDate)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsTable;