// src/renderer/pages/notification/components/reminderFilterPannel.tsx
import React from 'react';
import { Filter, X } from 'lucide-react';

interface NotificationFilterPanelProps {
  filters: {
    status?: string;
    channel?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
  onChange: (filters: any) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const NotificationFilterPanel: React.FC<NotificationFilterPanelProps> = ({
  filters,
  onChange,
  onClear,
  isOpen,
  onToggle,
}) => {
  const hasFilters = !!(
    filters.status ||
    filters.channel ||
    filters.startDate ||
    filters.endDate
  );

  const updateFilter = (key: string, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter Notification Logs
        </span>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value || undefined)}
            className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="resend">Resent</option>
          </select>
        </div>

        {/* Channel */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Channel
          </label>
          <select
            value={filters.channel || ''}
            onChange={(e) => updateFilter('channel', e.target.value || undefined)}
            className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
            className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
            className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-color)]">
        <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Sort by
        </span>
        <select
          value={filters.sortBy || 'created_at'}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="px-3 py-1 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="created_at">Created at</option>
          <option value="sent_at">Sent at</option>
          <option value="recipient_email">Recipient</option>
          <option value="status">Status</option>
          <option value="retry_count">Retry count</option>
        </select>
        <select
          value={filters.sortOrder || 'DESC'}
          onChange={(e) => updateFilter('sortOrder', e.target.value as 'ASC' | 'DESC')}
          className="px-3 py-1 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </select>
      </div>
    </div>
  );
};