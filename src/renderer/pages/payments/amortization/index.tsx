// src/renderer/pages/payments/amortization/index.tsx

import React, { useState } from 'react';
import { Calendar, Download, RefreshCw, Filter, Eye, EyeOff, X } from 'lucide-react';
import Button from '../../../components/UI/Button';
import DebtSelect from '../../../components/Selects/Debt';
import useAmortizationSchedule from './hooks/useAmortizationSchedule';
import AmortizationSummary from './components/AmortizationSummary';
import AmortizationTable from './components/AmortizationTable';
import FrequencySelector from './components/FrequencySelector';
import { dialogs } from '../../../utils/dialogs';
import LoadingSpinner from '../../../components/Shared/LoadingSpinner';
import AmortizationStatsCards from './components/AmortizationStatsCards';

const AmortizationPage: React.FC = () => {
  const {
    debts,
    schedule,
    loading,
    error,
    selectedDebtId,
    setSelectedDebtId,
    frequency,
    setFrequency,
    refresh,
  } = useAmortizationSchedule();

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const handleExport = () => {
    if (!schedule || schedule.entries.length === 0) {
      dialogs.warning('No schedule to export');
      return;
    }

    const headers = ['Period', 'Payment Date', 'Payment', 'Interest', 'Principal', 'Balance'];
    const rows = schedule.entries.map(e => [
      e.period,
      e.paymentDate,
      e.paymentAmount.toFixed(2),
      e.interestAmount.toFixed(2),
      e.principalAmount.toFixed(2),
      e.remainingBalance.toFixed(2),
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amortization_${schedule.debtId}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    dialogs.success('Export completed');
  };

  const handleDebtChange = (debtId: number | null, debt?: any) => {
    setSelectedDebtId(debtId);
  };

  const hasFilters = !!selectedDebtId;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--primary-color)]" />
            Payment Plan (Amortization)
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            View amortization schedules for active loans
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title={showStats ? "Hide summary" : "Show summary"}
          >
            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={!schedule || schedule.entries.length === 0}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      {showStats && schedule && (
        <AmortizationStatsCards
          principal={schedule.principal}
          totalPayments={schedule.totalPayments}
          totalInterest={schedule.totalInterest}
          totalPeriods={schedule.totalPeriods}
        />
      )}

      {/* Filters Bar */}
      {showFilters && (
        <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </span>
            {hasFilters && (
              <button
                onClick={() => {
                  setSelectedDebtId(null);
                  setFrequency('monthly');
                }}
                className="text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DebtSelect
              value={selectedDebtId}
              onChange={handleDebtChange}
              statusFilter="active"
              placeholder="Select a debt to amortize..."
              className="w-full"
            />
            <FrequencySelector value={frequency} onChange={setFrequency} disabled={loading} />
          </div>
        </div>
      )}

      {/* Quick filters when filters are hidden */}
      {!showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DebtSelect
            value={selectedDebtId}
            onChange={handleDebtChange}
            statusFilter="active"
            placeholder="Select a debt to amortize..."
            className="w-full"
          />
          <FrequencySelector value={frequency} onChange={setFrequency} disabled={loading} />
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8 text-[var(--danger-color)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)]">
          <p className="text-sm">Error: {error}</p>
          <button
            onClick={refresh}
            className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Summary - compact version when stats cards are hidden */}
          {!showStats && schedule && (
            <div className="mb-2">
              <AmortizationSummary schedule={schedule} />
            </div>
          )}

          {/* Table */}
          {schedule && schedule.entries.length > 0 && (
            <AmortizationTable entries={schedule.entries} />
          )}

          {/* No data states */}
          {!schedule && debts.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No active debts found</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Create a new debt to generate an amortization schedule
              </p>
            </div>
          )}

          {!schedule && debts.length > 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>Select a debt to view amortization</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Choose from the dropdown above
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AmortizationPage;