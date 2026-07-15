// src/renderer/pages/payments/schedule/components/CalendarView.tsx
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, DollarSign, User } from "lucide-react";
import type { ScheduledPayment } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface CalendarViewProps {
  payments: ScheduledPayment[];
  onDateClick: (date: string, paymentsOnDate: ScheduledPayment[]) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ payments, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const paymentsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPayment[]>();
    payments.forEach(p => {
      let dateKey: string;
      if (typeof p.dueDate === 'string') {
        dateKey = p.dueDate.slice(0, 10);
      } else if (p.dueDate instanceof Date) {
        dateKey = p.dueDate.toISOString().slice(0, 10);
      } else {
        return;
      }
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(p);
    });
    return map;
  }, [payments]);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthYear = currentMonth.getFullYear();
  const month = String(currentMonth.getMonth() + 1).padStart(2, "0");

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          {monthName} {year}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: "var(--card-secondary-bg)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-secondary)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-secondary)]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="aspect-square rounded-lg border border-[var(--border-color)]"
                style={{ backgroundColor: "var(--card-secondary-bg)" }}
              />
            );
          }

          const dateKey = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayPayments = paymentsByDate.get(dateKey) || [];
          const isToday = today.toISOString().slice(0, 10) === dateKey;
          const hasPayments = dayPayments.length > 0;
          const dayTotal = dayPayments.reduce((sum, p) => sum + p.amountDue, 0);

          return (
            <div
              key={day}
              onClick={() => hasPayments && onDateClick(dateKey, dayPayments)}
              className={`aspect-square rounded-lg border p-1 cursor-pointer transition-all hover:shadow-md ${
                hasPayments ? "hover:border-[var(--primary-color)]" : ""
              } ${isToday ? "border-[var(--primary-color)] border-2" : "border-[var(--border-color)]"}`}
              style={{
                backgroundColor: hasPayments ? "var(--card-secondary-bg)" : "var(--card-bg)",
              }}
            >
              <div className="flex flex-col h-full">
                <div className={`text-right text-xs font-medium ${isToday ? "text-[var(--primary-color)]" : "text-[var(--text-primary)]"}`}>
                  {day}
                </div>
                {hasPayments && (
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="text-[10px] font-semibold text-[var(--success-color)] text-right">
                      {formatCurrency(dayTotal)}
                    </div>
                    <div className="flex items-center justify-end gap-0.5 mt-0.5">
                      <User className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {dayPayments.length}
                      </span>
                    </div>
                    {dayPayments.length > 0 && (
                      <div className="text-[8px] text-[var(--text-tertiary)] truncate mt-0.5">
                        {dayPayments.slice(0, 2).map(p => p.borrowerName).join(", ")}
                        {dayPayments.length > 2 && ` +${dayPayments.length - 2}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;