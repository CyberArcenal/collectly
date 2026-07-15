// src/renderer/pages/sync/index.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw,
  Cloud,
  CloudOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  HardDrive,
  Loader2,
  Play,
  Trash2,
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  CreditCard,
  Receipt,
  FileSignature,
  FileCheck,
  DollarSign,
  Eye,
  EyeOff,
  Plus,
  Minus,
  AlertCircle,
  Link,
  Link2,
  Wifi,
  WifiOff,
} from "lucide-react";
import syncAPI, {
  type SyncStatus,
  type SyncSummary,
  type SyncProgress,
} from "../../api/utils/sync";
import { useAuth } from "../../contexts/AuthContext";
import { dialogs } from "../../utils/dialogs";
import { showSuccess, showError, showLoading, hideLoading } from "../../utils/notification";
import Button from "../../components/UI/Button";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";

// ============================================================
// TYPES
// ============================================================

interface EntityStatus {
  name: string;
  status: string;
  lastSyncedAt: string | null;
  totalSynced: number;
  lastSyncCount: number;
  hasPending: boolean;
  icon: React.ReactNode;
  color: string;
}

interface Conflict {
  id: number;
  entity: string;
  entityId: number;
  localData: any;
  serverData: any;
  resolution: string;
  localUpdatedAt: string;
  serverUpdatedAt: string;
  notes: string | null;
  createdAt: string;
}

// ============================================================
// HELPERS
// ============================================================

const getEntityIcon = (name: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    Borrower: <Users className="w-4 h-4" />,
    Debt: <FileText className="w-4 h-4" />,
    PaymentTransaction: <CreditCard className="w-4 h-4" />,
    PenaltyTransaction: <AlertCircle className="w-4 h-4" />,
    LoanAgreement: <FileSignature className="w-4 h-4" />,
    LoanApplication: <FileCheck className="w-4 h-4" />,
    PaymentMethod: <DollarSign className="w-4 h-4" />,
  };
  return icons[name] || <Database className="w-4 h-4" />;
};

const getEntityColor = (name: string): string => {
  const colors: Record<string, string> = {
    Borrower: "bg-blue-500",
    Debt: "bg-purple-500",
    PaymentTransaction: "bg-green-500",
    PenaltyTransaction: "bg-red-500",
    LoanAgreement: "bg-orange-500",
    LoanApplication: "bg-indigo-500",
    PaymentMethod: "bg-teal-500",
  };
  return colors[name] || "bg-gray-500";
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "completed":
      return "text-green-500";
    case "syncing":
      return "text-yellow-500";
    case "failed":
      return "text-red-500";
    default:
      return "text-gray-400";
  }
};

const getStatusBadge = (status: string): { label: string; color: string } => {
  switch (status) {
    case "completed":
      return { label: "Synced", color: "bg-green-500/20 text-green-500" };
    case "syncing":
      return { label: "Syncing...", color: "bg-yellow-500/20 text-yellow-500" };
    case "failed":
      return { label: "Failed", color: "bg-red-500/20 text-red-500" };
    case "idle":
      return { label: "Idle", color: "bg-gray-500/20 text-gray-400" };
    default:
      return { label: "Unknown", color: "bg-gray-500/20 text-gray-400" };
  }
};

const formatDate = (date: string | null): string => {
  if (!date) return "Never";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "Invalid date";
  }
};

const formatDuration = (start: Date, end: Date): string => {
  const diff = (end.getTime() - start.getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ${Math.round(diff % 60)}s`;
  return `${Math.round(diff / 3600)}h ${Math.round((diff % 3600) / 60)}m`;
};

// ============================================================
// SUBCOMPONENTS
// ============================================================

const SyncStatusCard: React.FC<{
  summary: SyncSummary | null;
  isSyncing: boolean;
}> = ({ summary, isSyncing }) => {
  const cards = [
    {
      label: "Entities",
      value: summary?.totalEntities || 0,
      sub: `${summary?.completed || 0} synced`,
      icon: Database,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Pending Sync",
      value: summary?.queuePending || 0,
      sub: `${summary?.failed || 0} failed`,
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      label: "Total Synced",
      value: summary?.totalSynced?.toLocaleString() || 0,
      sub: "records",
      icon: HardDrive,
      color: "bg-green-500/10 text-green-500",
    },
    {
      label: "Conflicts",
      value: summary?.conflictPending || 0,
      sub: `${summary?.conflictPending || 0} pending`,
      icon: AlertTriangle,
      color: "bg-red-500/10 text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {card.label}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
                {card.value}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {card.sub}
              </p>
            </div>
            <div className={`p-2 rounded-full ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          {isSyncing && card.label === "Pending Sync" && (
            <div className="mt-2 h-1 bg-[var(--card-secondary-bg)] rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full animate-pulse w-full" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const EntityStatusItem: React.FC<{
  entity: EntityStatus;
  onSync: (name: string) => void;
}> = ({ entity, onSync }) => {
  const [expanded, setExpanded] = useState(false);
  const status = getStatusBadge(entity.status);

  return (
    <div
      className="border-b border-[var(--border-color)] last:border-0"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between py-2.5 px-3 hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full ${getEntityColor(entity.name)} flex items-center justify-center text-white`}
          >
            {getEntityIcon(entity.name)}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {entity.name}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {entity.totalSynced.toLocaleString()} records synced
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${getStatusColor(entity.status)}`}>
            {entity.hasPending ? (
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
              onSync(entity.name);
            }}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-secondary)] hover:text-[var(--primary-color)]"
            title={`Sync ${entity.name}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {expanded && (
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
              <span className="text-[var(--text-tertiary)]">Total Synced</span>
              <p className="font-medium text-[var(--text-primary)]">
                {entity.totalSynced.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Last Count</span>
              <p className="font-medium text-[var(--text-primary)]">
                {entity.lastSyncCount}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ConflictItem: React.FC<{
  conflict: Conflict;
  onResolve: (id: number, resolution: string) => void;
}> = ({ conflict, onResolve }) => {
  const [showDetails, setShowDetails] = useState(false);

  const entityColor = getEntityColor(conflict.entity);

  return (
    <div className="border border-[var(--border-color)] rounded-lg p-3 hover:bg-[var(--card-hover-bg)] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-6 h-6 rounded-full ${entityColor} flex items-center justify-center text-white text-[10px] font-medium`}
          >
            {conflict.entity.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {conflict.entity} #{conflict.entityId}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {formatDate(conflict.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
            Pending
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] text-[var(--text-tertiary)]"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onResolve(conflict.id, "server")}
            className="px-2 py-0.5 rounded text-xs bg-[var(--primary-color)] text-white hover:opacity-80"
          >
            Use Server
          </button>
          <button
            onClick={() => onResolve(conflict.id, "local")}
            className="px-2 py-0.5 rounded text-xs bg-[var(--accent-blue)] text-white hover:opacity-80"
          >
            Use Local
          </button>
        </div>
      </div>
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
              <div className="font-medium text-green-500 mb-1">Local Data</div>
              <pre className="text-[var(--text-secondary)] whitespace-pre-wrap break-all max-h-32 overflow-auto">
                {JSON.stringify(conflict.localData, null, 2)}
              </pre>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
              <div className="font-medium text-blue-500 mb-1">Server Data</div>
              <pre className="text-[var(--text-secondary)] whitespace-pre-wrap break-all max-h-32 overflow-auto">
                {JSON.stringify(conflict.serverData, null, 2)}
              </pre>
            </div>
          </div>
          {conflict.notes && (
            <div className="mt-2 text-xs text-[var(--text-tertiary)]">
              Notes: {conflict.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProgressBar: React.FC<{
  progress: SyncProgress | null;
  isVisible: boolean;
}> = ({ progress, isVisible }) => {
  if (!isVisible || !progress) return null;

  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Syncing...
          </span>
          {progress.currentEntity && (
            <span className="text-xs text-[var(--text-secondary)]">
              {progress.currentEntity}
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {progress.completed} / {progress.total}
          {progress.failed > 0 && (
            <span className="text-red-500 ml-1">({progress.failed} failed)</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-[var(--card-secondary-bg)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[var(--text-tertiary)]">
          {percentage}% complete
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">
          {progress.status === "completed" ? "✅ Done" : "⏳ Processing..."}
        </span>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const SyncPage: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  const progressUnsubscribe = useRef<(() => void) | null>(null);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, summaryRes, conflictsRes, queueRes] = await Promise.all([
        syncAPI.getStatus(),
        syncAPI.getSummary(),
        syncAPI.getConflicts(),
        syncAPI.getQueueStatus(),
      ]);

      setStatus(statusRes);
      setSummary(summaryRes);
      setConflicts(conflictsRes.conflicts || []);
      setQueueItems(queueRes.items || []);
    } catch (err: any) {
      showError(err.message || "Failed to load sync data");
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // PROGRESS LISTENER
  // ============================================================

  useEffect(() => {
    progressUnsubscribe.current = syncAPI.onProgress((progressData) => {
      setProgress(progressData);
      if (progressData.status === "completed" || progressData.status === "failed") {
        setSyncing(false);
        fetchData();
        if (progressData.status === "completed") {
          showSuccess("Sync completed successfully!");
        } else {
          showError("Sync completed with errors. Check the logs.");
        }
      }
    });

    return () => {
      if (progressUnsubscribe.current) {
        progressUnsubscribe.current();
      }
    };
  }, [fetchData]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleFullSync = async () => {
    const confirmed = await dialogs.confirm({
      title: "Full Sync",
      message: "This will sync all data from the local database to the server. Are you sure?",
    });
    if (!confirmed) return;

    setSyncing(true);
    try {
      const result = await syncAPI.fullSync(user?.username || "system");
      showSuccess(`Full sync completed! ${result.success} succeeded, ${result.failed} failed.`);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleIncrementalSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAPI.incrementalSync(user?.username || "system");
      showSuccess(`Incremental sync completed! ${result.completed} processed.`);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncEntity = async (entityName: string) => {
    try {
      showLoading(`Syncing ${entityName}...`);
      const result = await syncAPI.syncEntity(entityName, false, user?.username || "system");
      showSuccess(`Synced ${entityName}: ${result.count} records`);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      hideLoading();
    }
  };

  const handleResolveConflict = async (conflictId: number, resolution: string) => {
    try {
      await syncAPI.resolveConflict(conflictId, resolution as any, user?.username || "system");
      showSuccess(`Conflict resolved with ${resolution}`);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleAutoResolve = async () => {
    const confirmed = await dialogs.confirm({
      title: "Auto-Resolve Conflicts",
      message: "This will automatically resolve all pending conflicts using Last Write Wins (server priority). Continue?",
    });
    if (!confirmed) return;

    try {
      const result = await syncAPI.autoResolveConflicts();
      showSuccess(`Auto-resolved ${result.resolved} conflicts`);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleCleanup = async () => {
    const confirmed = await dialogs.confirm({
      title: "Cleanup Sync Data",
      message: "This will delete old sync records (30+ days). Continue?",
    });
    if (!confirmed) return;

    try {
      const result = await syncAPI.cleanup(30);
      showSuccess(`Cleanup completed: ${result.queueDeleted} queue items, ${result.conflictDeleted} conflicts`);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleReset = async () => {
    const confirmed = await dialogs.confirm({
      title: "Reset Sync State",
      message: "This will reset all sync statuses. Use this if you're having sync issues. Continue?",
    });
    if (!confirmed) return;

    try {
      await syncAPI.resetSync(undefined, user?.username || "system");
      showSuccess("Sync state reset successfully");
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  const entityList = status?.entities || [];

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[var(--primary-color)]" />
            Data Sync
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Synchronize local data with the server
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Online/Offline Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--card-secondary-bg)] border border-[var(--border-color)]">
            {summary?.isSyncing || syncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
                <span className="text-xs text-yellow-500 font-medium">Syncing...</span>
              </>
            ) : status?.isSyncing === false ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-500 font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-500 font-medium">Offline</span>
              </>
            )}
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">
            Last sync: {summary?.lastSync ? formatDate(summary.lastSync) : "Never"}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SyncStatusCard summary={summary} isSyncing={syncing || !!summary?.isSyncing} />

      {/* Progress Bar */}
      <ProgressBar progress={progress} isVisible={syncing || !!summary?.isSyncing} />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={Play}
          onClick={handleFullSync}
          disabled={syncing || loading}
          className="flex items-center gap-1.5"
        >
          {syncing ? "Syncing..." : "Full Sync"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={handleIncrementalSync}
          disabled={syncing || loading}
        >
          Incremental Sync
        </Button>
        <Button
          variant="warning"
          size="sm"
          icon={AlertTriangle}
          onClick={handleAutoResolve}
          disabled={conflicts.length === 0 || syncing}
        >
          Auto-Resolve ({conflicts.length})
        </Button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          style={{
            backgroundColor: "var(--card-secondary-bg)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <Settings className="w-4 h-4" />
          Advanced
          {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Advanced Actions */}
      {showAdvanced && (
        <div className="bg-[var(--card-secondary-bg)] rounded-xl border border-[var(--border-color)] p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Trash2}
              onClick={handleCleanup}
              disabled={syncing}
            >
              Cleanup (30d)
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={handleReset}
              disabled={syncing}
            >
              Reset Sync State
            </Button>
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            <p>⚠️ Cleanup removes old sync records. Reset clears sync statuses for troubleshooting.</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Entities List */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--primary-color)]" />
                Entities
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({entityList.length})
                </span>
              </h3>
              <button
                onClick={fetchData}
                disabled={loading}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="medium" />
                </div>
              ) : entityList.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-tertiary)]">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No entities found</p>
                </div>
              ) : (
                entityList.map((entity) => (
                  <EntityStatusItem
                    key={entity.name}
                    entity={entity}
                    onSync={handleSyncEntity}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Conflicts */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer"
              onClick={() => setShowConflicts(!showConflicts)}
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Conflicts
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({conflicts.length})
                </span>
              </h3>
              <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                {showConflicts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {showConflicts && (
              <div className="p-3 max-h-60 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-4">
                    <LoadingSpinner size="small" />
                  </div>
                ) : conflicts.length === 0 ? (
                  <div className="text-center py-4 text-[var(--text-tertiary)] text-sm">
                    <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-500" />
                    No conflicts detected
                  </div>
                ) : (
                  conflicts.map((conflict) => (
                    <ConflictItem
                      key={conflict.id}
                      conflict={conflict}
                      onResolve={handleResolveConflict}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Queue Status */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer"
              onClick={() => setShowQueue(!showQueue)}
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Queue
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({queueItems.length})
                </span>
              </h3>
              <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                {showQueue ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {showQueue && (
              <div className="p-3 max-h-40 overflow-y-auto">
                {queueItems.length === 0 ? (
                  <div className="text-center py-2 text-[var(--text-tertiary)] text-sm">
                    Queue is empty
                  </div>
                ) : (
                  <div className="space-y-1">
                    {queueItems.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="text-xs flex justify-between py-1 border-b border-[var(--border-color)] last:border-0">
                        <span className="text-[var(--text-secondary)]">
                          {item.entity}#{item.entityId}
                        </span>
                        <span className={`font-medium ${item.status === "pending" ? "text-yellow-500" : item.status === "failed" ? "text-red-500" : "text-green-500"}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                    {queueItems.length > 5 && (
                      <div className="text-xs text-[var(--text-tertiary)] text-center pt-1">
                        +{queueItems.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="bg-[var(--card-secondary-bg)] rounded-xl border border-[var(--border-color)] p-3">
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {summary?.isSyncing ? "Syncing" : "Idle"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entities</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {summary?.totalEntities || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Synced</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {summary?.totalSynced?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Sync</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {summary?.lastSync ? formatDate(summary.lastSync) : "Never"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-3">
        <p>
          Sync Service v1.0 • {summary?.isSyncing ? "🔄 Syncing..." : "✅ Ready"}
        </p>
      </div>
    </div>
  );
};

export default SyncPage;