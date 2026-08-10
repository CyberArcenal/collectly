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
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

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

const SyncEntityList: React.FC<SyncEntityListProps> = ({ entities, loading }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});


  console.log("SyncEntityList rendered with entities:", entities);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (!entities || entities.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)]">
        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No entities found</p>
      </div>
    );
  }

  console.log("Rendering SyncEntityList with entities:", entities);

  return (
    <div className="divide-y divide-[var(--border-color)]">
      {entities.map((entity) => {
        const status = getStatusBadge(entity.status);
        const isExpanded = expanded[entity.name] || false;
        const hasPending = entity.hasPending;
        const hasLocalChanges = entity.hasLocalChanges;
        const recordCount = entity.recordCount ?? 0;
        const localRecordCount = entity.localRecordCount ?? 0;

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
                        Pending
                      </span>
                    )}
                    {hasLocalChanges && (
                      <span className="text-xs bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-full">
                        {(recordCount - localRecordCount)} new
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {recordCount.toLocaleString()} records
                    {localRecordCount > 0 && localRecordCount !== recordCount && (
                      <span className="ml-1">
                        (was {localRecordCount.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${hasPending ? "text-yellow-500" : status.color}`}>
                  {hasPending ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      {entity.status === "syncing" ? "Syncing" : "Failed"}
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
                    <span className="text-[var(--text-tertiary)]">Records</span>
                    <p className="font-medium text-[var(--text-primary)]">
                      {recordCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Total Synced</span>
                    <p className="font-medium text-[var(--text-primary)]">
                      {entity.totalSynced?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                  {entity.hasError && entity.errorMessage && (
                    <div className="col-span-full mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs">
                      Error: {entity.errorMessage}
                    </div>
                  )}
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