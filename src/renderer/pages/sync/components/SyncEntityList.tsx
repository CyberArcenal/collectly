// src/renderer/pages/sync/components/SyncEntityList.tsx
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Users,
  FileText,
  CreditCard,
  Receipt,
  FileSignature,
  FileCheck,
  DollarSign,
} from "lucide-react";

interface EntityStatusItem {
  name: string;
  status: string;
  lastSyncedAt: string | null;
  totalSynced: number;
  lastSyncCount: number;
  hasPending: boolean;
  hasError: boolean;
  errorMessage: string | null;
  recordCount: number;
  localRecordCount: number;
  hasLocalChanges: boolean;
}

interface SyncEntityListProps {
  entities: EntityStatusItem[];
  loading: boolean;
}

const getStatusBadge = (status: string, hasPending: boolean) => {
  if (hasPending) return { label: "Pending", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" };
  switch (status) {
    case "completed": return { label: "Synced", color: "bg-green-500/20 text-green-500 border-green-500/30" };
    case "syncing": return { label: "Syncing...", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" };
    case "failed": return { label: "Failed", color: "bg-red-500/20 text-red-500 border-red-500/30" };
    default: return { label: "Idle", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  }
};

const getEntityIcon = (name: string) => {
  const icons: Record<string, React.ReactNode> = {
    Borrower: <Users className="w-4 h-4" />,
    Debt: <FileText className="w-4 h-4" />,
    PaymentTransaction: <CreditCard className="w-4 h-4" />,
    PenaltyTransaction: <Receipt className="w-4 h-4" />,
    LoanAgreement: <FileSignature className="w-4 h-4" />,
    LoanApplication: <FileCheck className="w-4 h-4" />,
    PaymentMethod: <DollarSign className="w-4 h-4" />,
  };
  return icons[name] || <Database className="w-4 h-4" />;
};

const formatDate = (date: string | null): string => {
  if (!date) return "Never";
  try {
    return new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return "Invalid date"; }
};

const SyncEntityList: React.FC<SyncEntityListProps> = ({ entities, loading }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (name: string) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  if (loading && entities.length === 0) {
    return (
      <div className="divide-y divide-[var(--border-color)] animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--card-secondary-bg)]" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-[var(--card-secondary-bg)] rounded" />
                <div className="h-3 w-16 bg-[var(--card-secondary-bg)] rounded" />
              </div>
            </div>
            <div className="h-6 w-16 bg-[var(--card-secondary-bg)] rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
        <Database className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-medium">No entities found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)]/50 border-b border-[var(--border-color)]">
          <tr>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Entity</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hidden md:table-cell">Records</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hidden lg:table-cell">Last Synced</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {entities.map((entity) => {
            const status = getStatusBadge(entity.status, entity.hasPending);
            const isExpanded = expanded[entity.name] || false;
            const recordCount = entity.recordCount ?? 0;
            const localRecordCount = entity.localRecordCount ?? 0;
            const diff = recordCount - localRecordCount;

            return (
              <React.Fragment key={entity.name}>
                <tr className="hover:bg-[var(--card-hover-bg)] transition-colors duration-150 group">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center text-[var(--primary-color)]">
                        {getEntityIcon(entity.name)}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{entity.name}</div>
                        <div className="text-xs text-[var(--text-tertiary)] md:hidden">
                          {recordCount} records • {formatDate(entity.lastSyncedAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[var(--text-primary)]">{recordCount}</span>
                      {diff > 0 && (
                        <span className="text-xs bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-full">+{diff}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-[var(--text-secondary)]">
                    {formatDate(entity.lastSyncedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                      {entity.hasPending && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />}
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => toggleExpand(entity.name)}
                      className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 bg-[var(--card-secondary-bg)]/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
                        <div><span className="text-[var(--text-tertiary)]">Status</span><p className="font-medium text-[var(--text-primary)]">{status.label}</p></div>
                        <div><span className="text-[var(--text-tertiary)]">Last Sync</span><p className="font-medium text-[var(--text-primary)]">{formatDate(entity.lastSyncedAt)}</p></div>
                        <div><span className="text-[var(--text-tertiary)]">Total Synced</span><p className="font-medium text-[var(--text-primary)]">{entity.totalSynced?.toLocaleString() ?? '0'}</p></div>
                        <div><span className="text-[var(--text-tertiary)]">Local Changes</span><p className="font-medium text-[var(--text-primary)]">{diff > 0 ? `+${diff} new` : 'None'}</p></div>
                        {entity.hasError && entity.errorMessage && (
                          <div className="col-span-full mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs">
                            Error: {entity.errorMessage}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SyncEntityList;