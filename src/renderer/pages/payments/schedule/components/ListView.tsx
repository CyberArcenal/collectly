// src/renderer/pages/payments/schedule/components/ListView.tsx
import React from "react";
import { Calendar, User, DollarSign, CreditCard, Phone, Mail } from "lucide-react";
import type { ScheduledPayment } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ListViewProps {
  payments: ScheduledPayment[];
  onMarkPaid: (payment: ScheduledPayment) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ListView: React.FC<ListViewProps> = ({ payments, onMarkPaid }) => {
  const groupedByDate = payments.reduce((acc, p) => {
    let dateKey: string;
    if (typeof p.dueDate === 'string') {
      dateKey = p.dueDate.slice(0, 10);
    } else if (p.dueDate instanceof Date) {
      dateKey = p.dueDate.toISOString().slice(0, 10);
    } else {
      return acc;
    }
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(p);
    return acc;
  }, {} as Record<string, ScheduledPayment[]>);

  return (
    <div className="space-y-3">
      {Object.entries(groupedByDate).map(([date, dayPayments]) => {
        const dayTotal = dayPayments.reduce((sum, p) => sum + p.amountDue, 0);
        return (
          <div
            key={date}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden"
          >
            {/* Date Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)]"
              style={{ backgroundColor: "var(--card-secondary-bg)" }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--primary-color)]" />
                <span className="font-semibold text-[var(--text-primary)] text-sm">
                  {formatDate(date)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[var(--text-secondary)]">
                  {dayPayments.length} payment{dayPayments.length > 1 ? 's' : ''}
                </span>
                <span className="font-semibold" style={{ color: "var(--debt-high)" }}>
                  {formatCurrency(dayTotal)}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium">Debtor</th>
                    <th className="text-left py-2 px-4 font-medium">Debt</th>
                    <th className="text-right py-2 px-4 font-medium">Amount Due</th>
                    <th className="text-center py-2 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dayPayments.map((p) => (
                    <tr
                      key={p.debtId}
                      className="border-t border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                            {getInitials(p.borrowerName)}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text-primary)] text-sm">
                              {p.borrowerName}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                              {p.contact && (
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-2.5 h-2.5" />
                                  {p.contact}
                                </span>
                              )}
                              {p.email && (
                                <span className="flex items-center gap-0.5">
                                  <Mail className="w-2.5 h-2.5" />
                                  {p.email}
                                </span>
                              )}
                              {!p.contact && !p.email && "No contact"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-secondary)] text-sm">
                        {p.debtName}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold" style={{ color: "var(--debt-high)" }}>
                        {formatCurrency(p.amountDue)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => onMarkPaid(p)}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90 flex items-center gap-1.5 mx-auto"
                          style={{ backgroundColor: "var(--success-color)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--btn-success-hover)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--success-color)";
                          }}
                        >
                          <CreditCard className="w-3 h-3" />
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;