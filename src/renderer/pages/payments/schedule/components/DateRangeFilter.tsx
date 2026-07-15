// src/renderer/pages/payments/schedule/components/DateRangeFilter.tsx
import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateRangeFilterProps {
  value: "30" | "60" | "90" | "all";
  onChange: (value: "30" | "60" | "90" | "all") => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const options: { label: string; value: "30" | "60" | "90" | "all" }[] = [
    { label: "30 Days", value: "30" },
    { label: "60 Days", value: "60" },
    { label: "90 Days", value: "90" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="flex items-center gap-2">
      <CalendarIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
              }`}
              style={{
                backgroundColor: isActive ? "var(--primary-color)" : "var(--card-secondary-bg)",
                borderColor: isActive ? "var(--primary-color)" : "var(--border-color)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateRangeFilter;