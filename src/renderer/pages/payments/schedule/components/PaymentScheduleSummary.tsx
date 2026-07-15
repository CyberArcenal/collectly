// src/renderer/pages/payments/schedule/components/PaymentScheduleSummary.tsx
import React from 'react';
import { Calendar, DollarSign, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface DebtStats {
  totalDebts: number;
  totalActive: number;
  totalPaid: number;
  totalOverdue: number;
  totalDefaulted: number;
  totalAmountOwed: number;
  totalRemainingBalance: number;
}

interface PaymentScheduleSummaryProps {
  totalPayments: number;
  totalAmountDue: number;
  dateRange: string;
  debtStats: DebtStats | null;
  loadingStats?: boolean;
}

const formatCurrency = (value: number | string | null | undefined): string => {
  if (value == null) return "₱0.00";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return "₱0.00";
  return `₱${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

const formatNumber = (value: number | string | null | undefined): string => {
  if (value == null) return "0";
  const num = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(num) || !isFinite(num)) return "0";
  return num.toLocaleString();
};

const PaymentScheduleSummary: React.FC<PaymentScheduleSummaryProps> = ({
  totalPayments = 0,
  totalAmountDue = 0,
  dateRange = "30",
  debtStats,
  loadingStats = false,
}) => {
  // If loading stats, show skeleton
  if (loadingStats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-5 w-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const hasDebtStats = debtStats && debtStats.totalDebts > 0;

  // Cards: Show overall debt stats, plus upcoming payments
  const cards = [
    {
      title: "Total Active Debts",
      value: hasDebtStats ? debtStats.totalActive : 0,
      icon: CheckCircle,
      color: "bg-blue-500",
      format: formatNumber,
    },
    {
      title: "Overdue Debts",
      value: hasDebtStats ? debtStats.totalOverdue : 0,
      icon: AlertCircle,
      color: "bg-red-500",
      format: formatNumber,
    },
    {
      title: "Total Remaining Balance",
      value: hasDebtStats ? debtStats.totalRemainingBalance : 0,
      icon: DollarSign,
      color: "bg-green-500",
      format: formatCurrency,
    },
    {
      title: "Upcoming Payments",
      value: totalPayments,
      icon: Calendar,
      color: "bg-purple-500",
      format: formatNumber,
    },
  ];

  // Optional: Add a 5th card for total amount due in upcoming period
  const extraCard = {
    title: `Due in ${dateRange === "all" ? "All" : `${dateRange}d`}`,
    value: totalAmountDue,
    icon: Clock,
    color: "bg-orange-500",
    format: formatCurrency,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                {card.format(card.value)}
              </p>
            </div>
            <div className={`p-2 rounded-full ${card.color} bg-opacity-10`}>
              <card.icon className={`w-4 h-4 ${card.color.replace("bg-", "text-")}`} />
            </div>
          </div>
        </div>
      ))}
      {/* Extra card for amount due in upcoming period */}
      <div
        className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              {extraCard.title}
            </p>
            <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
              {extraCard.format(extraCard.value)}
            </p>
          </div>
          <div className={`p-2 rounded-full ${extraCard.color} bg-opacity-10`}>
            <extraCard.icon className={`w-4 h-4 ${extraCard.color.replace("bg-", "text-")}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentScheduleSummary;