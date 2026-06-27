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

  const getTabStyle = (tabValue: PeriodType) => {
    if (value === tabValue) {
      return {
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        borderColor: 'var(--primary-color)',
      };
    }
    return {
      backgroundColor: 'var(--card-secondary-bg)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-color)',
    };
  };

  return (
    <div className="flex flex-wrap gap-1 border rounded-md p-1" style={{ borderColor: 'var(--border-color)' }}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => !disabled && onChange(tab.value)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={getTabStyle(tab.value)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodTabs;