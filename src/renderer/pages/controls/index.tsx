// src/renderer/pages/controls/index.tsx
import React, { useState } from "react";
import {
  Server,
  RefreshCw,
  Loader2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
} from "lucide-react";
import { useControls } from "./hooks/useControls";
import ControlsTaskCard from "./components/ControlsTaskCard";
import ControlsHealthCard from "./components/ControlsHealthCard";
import Button from "../../components/UI/Button";

const ControlsPage: React.FC = () => {
  const {
    loading,
    error,
    triggerInterestAccrual,
    getInterestAccrualStatus,
    triggerOverdueCorrector,
    getOverdueCorrectorStatus,
    triggerOverdueUpdater,
    getOverdueUpdaterStatus,
    triggerZeroBalanceFixer,
    getZeroBalanceFixerStatus,
    triggerPenaltyScheduler,
    getPenaltySchedulerStatus,
    getOverdueStatusHealth,
    getZeroBalanceHealth,
    getPenaltyHealth,
    refreshAll,
  } = useControls();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Server className="w-5 h-5 text-[var(--primary-color)]" />
            Server Controls
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage and monitor background tasks on the server
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefreshAll}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5"
          >
            {refreshing ? "Refreshing..." : "Refresh All"}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-500">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {error}
        </div>
      )}

      {/* Task Cards Grid */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Scheduled Tasks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <ControlsTaskCard
            title="Interest Accrual"
            description="Daily interest accrual for active debts"
            onTrigger={triggerInterestAccrual}
            onFetchStatus={getInterestAccrualStatus}
            loading={loading}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <ControlsTaskCard
            title="Overdue Corrector"
            description="Correct misclassified overdue debts"
            onTrigger={triggerOverdueCorrector}
            onFetchStatus={getOverdueCorrectorStatus}
            loading={loading}
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <ControlsTaskCard
            title="Overdue Updater"
            description="Mark active debts as overdue when due date passes"
            onTrigger={triggerOverdueUpdater}
            onFetchStatus={getOverdueUpdaterStatus}
            loading={loading}
            icon={<Clock className="w-5 h-5" />}
          />
          <ControlsTaskCard
            title="Zero Balance Fixer"
            description="Fix debts with zero balance but incorrect status"
            onTrigger={triggerZeroBalanceFixer}
            onFetchStatus={getZeroBalanceFixerStatus}
            loading={loading}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <ControlsTaskCard
            title="Penalty Scheduler"
            description="Apply auto-penalties to overdue debts"
            onTrigger={triggerPenaltyScheduler}
            onFetchStatus={getPenaltySchedulerStatus}
            loading={loading}
            icon={<Zap className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Health Checks Grid */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Health Checks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <ControlsHealthCard
            title="Overdue Status Health"
            description="Detect inconsistencies in overdue statuses"
            onFetchHealth={getOverdueStatusHealth}
            loading={loading}
            icon={<Activity className="w-5 h-5" />}
          />
          <ControlsHealthCard
            title="Zero Balance Health"
            description="Find debts with zero balance not marked paid"
            onFetchHealth={getZeroBalanceHealth}
            loading={loading}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <ControlsHealthCard
            title="Penalty Health"
            description="Check for missing or extra penalties"
            onFetchHealth={getPenaltyHealth}
            loading={loading}
            icon={<Zap className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-3">
        <p>Controls API v1.0 • {loading ? "⏳ Loading..." : "✅ Ready"}</p>
      </div>
    </div>
  );
};

export default ControlsPage;