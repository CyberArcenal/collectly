// src/renderer/pages/payments/amortization/index.tsx

import React, { useState } from 'react';
import { Calendar, Download, RefreshCw, Filter, X } from 'lucide-react';
import Button from '../../../components/UI/Button';
import DebtSelect from '../../../components/Selects/Debt';
import useAmortizationSchedule from './hooks/useAmortizationSchedule';
import AmortizationSummary from './components/AmortizationSummary';
import AmortizationTable from './components/AmortizationTable';
import FrequencySelector from './components/FrequencySelector';
import { dialogs } from '../../../utils/dialogs';

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
  };

  const handleDebtChange = (debtId: number | null, debt?: any) => {
    setSelectedDebtId(debtId);
  };

  return (
    <div className="m-1" style={{ backgroundColor: 'var(--background-color)' }}>
      <div
        className="rounded-md shadow-md border p-4"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Header - aligned with ActiveLoansPage */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6" style={{ color: 'var(--primary-color)' }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--sidebar-text)' }}>
              Payment Plan (Amortization)
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Filter className="w-4 h-4" /> Filters {showFilters ? '↑' : '↓'}
            </button>
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!schedule || schedule.entries.length === 0}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters - aligned with ActiveLoansPage */}
        {showFilters && (
          <div
            className="mb-4 p-3 rounded-md border"
            style={{
              backgroundColor: 'var(--card-secondary-bg)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DebtSelect
                value={selectedDebtId}
                onChange={handleDebtChange}
                statusFilter="active"
                placeholder="Select a debt to amortize..."
                className="w-full"
              />
              <FrequencySelector value={frequency} onChange={setFrequency} disabled={loading} />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedDebtId(null);
                  setFrequency('monthly');
                }}
                className="text-sm text-[var(--primary-color)] flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        )}

        {/* Quick filters when filters are hidden */}
        {!showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
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

        {/* Loading / Error - centered like ActiveLoansPage */}
        {(loading || error) && (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            {loading && (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-color)]"></div>
                <p className="text-sm text-[var(--text-secondary)]">Loading schedule...</p>
              </div>
            )}
            {error && (
              <div className="text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-red-500">Error: {error}</p>
                <button
                  onClick={refresh}
                  className="mt-3 px-4 py-2 bg-[var(--primary-color)] text-white rounded-md text-sm"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content - aligned with ActiveLoansPage */}
        {!loading && !error && (
          <>
            {/* Summary */}
            {schedule && (
              <div className="mb-4">
                <AmortizationSummary schedule={schedule} />
              </div>
            )}

            {/* Table */}
            {schedule && schedule.entries.length > 0 && (
              <AmortizationTable entries={schedule.entries} />
            )}

            {/* No data state - aligned with ActiveLoansPage */}
            {!schedule && debts.length === 0 && (
              <div
                className="text-center py-12 border rounded-md"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                  No active debts found
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Create a new debt or check back later.
                </p>
              </div>
            )}

            {!schedule && debts.length > 0 && (
              <div
                className="text-center py-12 border rounded-md"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                  Select a debt to view amortization
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Choose from the dropdown above.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AmortizationPage;