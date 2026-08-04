// src/renderer/pages/sync/components/SyncEntityList.tsx

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
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
  AlertCircle,
  Eye,
} from "lucide-react";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

interface EntityStatusItem {
  name: string;
  status: string;
  lastSyncedAt: string | null;
  totalSynced: number;
  lastSyncCount: number;
  hasPending: boolean;
  pendingCount: number;
  recordCount: number;          // <-- new
}

interface SyncEntityListProps {
  entities: EntityStatusItem[];
  loading: boolean;
  onSyncEntity: (name: string) => void;
  onViewPending: (name: string) => void;
}

const getStatusBadge = (status: string): { label: string; color: string } => {
  switch (status) {
    case "completed":
      return { label: "Synced", color: "bg-green-500/20 text-green-500" };
    case "syncing":
      return { label: "Syncing...", color: "bg-yellow-500/20 text-yellow-500" };
    case "failed":
      return { label: "Failed", color: "bg-red-500/20 text-red-500" };
    default:
      return { label: "Idle", color: "bg-gray-500/20 text-gray-400" };
  }
};

const getEntityIcon = (name: string) => {
  const icons: Record<string, React.ReactNode> = {
    Borrower: <Users className="w-3.5 h-3.5" />,
    Debt: <FileText className="w-3.5 h-3.5" />,
    PaymentTransaction: <CreditCard className="w-3.5 h-3.5" />,
    PenaltyTransaction: <Receipt className="w-3.5 h-3.5" />,
    LoanAgreement: <FileSignature className="w-3.5 h-3.5" />,
    LoanApplication: <FileCheck className="w-3.5 h-3.5" />,
    PaymentMethod: <DollarSign className="w-3.5 h-3.5" />,
  };
  return icons[name] || <Database className="w-3.5 h-3.5" />;
};

const formatDate = (date: string | null): string => {
  if (!date) return "Never";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "Invalid date";
  }
};

const SyncEntityList: React.FC<SyncEntityListProps> = ({
  entities,
  loading,
  onSyncEntity,
  onViewPending,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Log entity data on render
  useEffect(() => {
    console.log("[SyncEntityList] Entities received:", entities);
    entities.forEach(entity => {
      console.log(`[SyncEntityList] Entity ${entity.name}: recordCount=${entity.recordCount}, totalSynced=${entity.totalSynced}`);
    });
  }, [entities]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)]">
        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No entities found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--border-color)]">
      {entities.map((entity) => {
        const status = getStatusBadge(entity.status);
        const isExpanded = expanded[entity.name] || false;
        const hasPending = entity.pendingCount > 0;

        return (
          <div
            key={entity.name}
            className="border-b border-[var(--border-color)] last:border-0"
          >
            <div
              className="flex items-center justify-between py-2.5 px-3 hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
              onClick={() => toggleExpand(entity.name)}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center text-[var(--primary-color)]">
                  {getEntityIcon(entity.name)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                    {entity.name}
                    {hasPending && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full">
                        {entity.pendingCount} pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {(entity.recordCount ?? 0).toLocaleString()} records
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium ${
                    hasPending ? "text-yellow-500" : status.color
                  }`}
                >
                  {hasPending ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      Pending
                    </span>
                  ) : (
                    status.label
                  )}
                </span>
                {entity.lastSyncedAt && (
                  <span className="text-xs text-[var(--text-tertiary)] hidden sm:block">
                    {formatDate(entity.lastSyncedAt)}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncEntity(entity.name);
                  }}
                  className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-secondary)] hover:text-[var(--primary-color)]"
                  title={`Sync ${entity.name}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(entity.name);
                  }}
                  className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="px-3 pb-3 pt-1 text-xs text-[var(--text-secondary)] bg-[var(--card-secondary-bg)]/50 rounded-b-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[var(--text-tertiary)]">Status</span>
                    <p className="font-medium text-[var(--text-primary)]">
                      {status.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Last Synced</span>
                    <p className="font-medium text-[var(--text-primary)]">
                      {formatDate(entity.lastSyncedAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Current Records</span>
                    <p className="font-medium text-[var(--text-primary)]">
                      {(entity.recordCount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Total Synced (cumulative)</span>
                    <p className="font-medium text-[var(--text-primary)]">
                      {entity.totalSynced.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewPending(entity.name);
                    }}
                    className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-secondary)] hover:text-[var(--primary-color)]"
                    title="View pending records"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SyncEntityList;