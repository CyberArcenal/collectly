// src/renderer/pages/payments/collection/components/PeriodTabs.tsx

import React from 'react';
import { CalendarDays, Calendar, CalendarRange, CalendarPlus } from 'lucide-react';
import type { PeriodType } from '../types';

interface PeriodTabsProps {
  value: PeriodType;
  onChange: (type: PeriodType) => void;
  disabled?: boolean;
}

const PeriodTabs: React.FC<PeriodTabsProps> = ({ value, onChange, disabled = false }) => {
  const tabs: { label: string; value: PeriodType; icon: React.ReactNode }[] = [
    { label: 'Weekly', value: 'weekly', icon: <CalendarDays className="w-4 h-4" /> },
    { label: 'Monthly', value: 'monthly', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Semi-Annual', value: 'semi-annual', icon: <CalendarRange className="w-4 h-4" /> },
    { label: 'Yearly', value: 'yearly', icon: <CalendarPlus className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => !disabled && onChange(tab.value)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive
                ? "text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
            }`}
            style={{
              backgroundColor: isActive ? "var(--primary-color)" : "var(--card-secondary-bg)",
              borderColor: isActive ? "var(--primary-color)" : "var(--border-color)",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default PeriodTabs;