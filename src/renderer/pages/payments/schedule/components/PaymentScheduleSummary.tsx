// src/renderer/pages/payments/schedule/components/PaymentScheduleSummary.tsx
import React from 'react';
import { Calendar, DollarSign, Clock, Users } from 'lucide-react';

interface PaymentScheduleSummaryProps {
  totalPayments: number;
  totalAmountDue: number;
  dateRange: string;
}

// ✅ Robust currency formatter with safe number handling
const formatCurrency = (value: number | string | null | undefined): string => {
  // Handle null/undefined
  if (value == null) return "₱0.00";
  
  // Convert to number
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if valid number
  if (isNaN(num) || !isFinite(num)) return "₱0.00";
  
  // Format with 2 decimal places and thousands separators
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
}) => {
  const cards = [
    {
      title: "Upcoming Payments",
      value: totalPayments,
      icon: Calendar,
      color: "bg-blue-500",
      format: formatNumber,
    },
    {
      title: "Total Amount Due",
      value: totalAmountDue,
      icon: DollarSign,
      color: "bg-red-500",
      format: formatCurrency,
    },
    {
      title: "Date Range",
      value: dateRange === "all" ? "All" : `${dateRange} days`,
      icon: Clock,
      color: "bg-yellow-500",
      format: (v: string) => v,
    },
    {
      title: "Avg per Payment",
      value: totalPayments > 0 ? totalAmountDue / totalPayments : 0,
      icon: Users,
      color: "bg-purple-500",
      format: formatCurrency,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
    </div>
  );
};

export default PaymentScheduleSummary;