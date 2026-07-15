// src/renderer/layouts/Sidebar/components/SidebarStats.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { HandCoins } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import type { SidebarStats as SidebarStatsType } from '../types';

interface SidebarStatsProps {
  stats: SidebarStatsType;
  loading: boolean;
}

const SidebarStats: React.FC<SidebarStatsProps> = ({ stats, loading }) => {
  return (
    <div className="p-4 border-t border-[var(--border-color)] bg-[var(--card-secondary-bg)]">
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Total Outstanding */}
        <div className="bg-[var(--status-overdue-bg)] text-[var(--status-overdue)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
          <div className="font-bold text-sm">
            {loading ? (
              <div className="animate-pulse h-4 w-16 bg-gray-300 rounded mx-auto" />
            ) : (
              formatCurrency(stats.totalOutstanding)
            )}
          </div>
          <div className="text-[10px]">Total Outstanding</div>
        </div>

        {/* Overdue */}
        <div className="bg-[var(--status-partial-bg)] text-[var(--status-partial)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
          <div className="font-bold text-sm">
            {loading ? (
              <div className="animate-pulse h-4 w-16 bg-gray-300 rounded mx-auto" />
            ) : (
              formatCurrency(stats.overdueAmount)
            )}
          </div>
          <div className="text-[10px]">Overdue</div>
        </div>

        {/* Collection Rate */}
        <div className="bg-[var(--status-paid-bg)] text-[var(--status-paid)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
          <div className="font-bold text-sm">
            {loading ? (
              <div className="animate-pulse h-4 w-12 bg-gray-300 rounded mx-auto" />
            ) : (
              `${stats.collectionRate.toFixed(1)}%`
            )}
          </div>
          <div className="text-[10px]">Collection Rate</div>
        </div>

        {/* Active Debtors */}
        <div className="bg-[var(--accent-blue-light)] text-[var(--accent-blue)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
          <div className="font-bold text-sm">
            {loading ? (
              <div className="animate-pulse h-4 w-8 bg-gray-300 rounded mx-auto" />
            ) : (
              stats.activeDebtors
            )}
          </div>
          <div className="text-[10px]">Active Debtors</div>
        </div>
      </div>

      <div className="flex justify-center">
        <Link
          to="/loans/active"
          className="w-full bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-sm py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
        >
          <HandCoins className="w-4 h-4" /> Manage Debts
        </Link>
      </div>
    </div>
  );
};

export default SidebarStats;