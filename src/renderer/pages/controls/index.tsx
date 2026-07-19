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
  Users,
  FileText,
  CreditCard,
  Database,
  Settings,
  Shield,
  Bell,
  Mail,
} from "lucide-react";
import { useControls } from "./hooks/useControls";
import ControlsTaskCard from "./components/ControlsTaskCard";
import ControlsHealthCard from "./components/ControlsHealthCard";
import ControlsSection from "./components/ControlsSection";
import Button from "../../components/UI/Button";

const ControlsPage: React.FC = () => {
  const {
    loading,
    error,
    // Debt & Collections
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
    // Health Checks
    getOverdueStatusHealth,
    getZeroBalanceHealth,
    getPenaltyHealth,
    // Audit & Notifications
    triggerAuditCleanup,
    getAuditCleanupStatus,
    triggerOverdueReminders,
    getOverdueRemindersStatus,
    triggerNotificationRetry,
    getNotificationRetryStatus,
    // Borrowers
    triggerCreditScoreRecalc,
    triggerBorrowerMerge,
    triggerBorrowerCleanup,
    triggerBorrowerStatusUpdate,
    // Groups
    triggerBulkAssign,
    triggerAutoAssign,
    triggerGroupCleanup,
    triggerGroupStatsUpdate,
    // Loan Agreements
    triggerAgreementCleanup,
    triggerOverdueAgreementNotify,
    triggerAutoAssignAgreements,
    triggerSyncAgreementStatus,
    // Loan Applications
    triggerAutoApprove,
    triggerStaleCleanup,
    triggerPendingReminders,
    triggerBulkImportApplications,
    // Payment Methods
    triggerPaymentMethodStatsRecalc,
    triggerPaymentMethodCleanup,
    triggerPaymentMethodReport,
    triggerEnsureDefaultMethod,
    // Sync
    triggerSyncHealthCheck,
    triggerSyncQueueRetry,
    triggerSyncCleanup,
    triggerSyncReport,
    // System Settings
    triggerSettingsCacheRefresh,
    triggerSettingsValidate,
    triggerSettingsBackup,
    triggerSettingsDiff,
    // Security
    triggerSecurityCleanup,
    triggerSecurityMonitor,
    triggerAutoSuspend,
    triggerOrphanCleanup,
    triggerSecurityReport,
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

      {/* ─── SECTION: Debt & Collections ─── */}
      <ControlsSection
        title="Debt & Collections"
        description="Manage debt-related background tasks"
        defaultExpanded={true}
      >
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
      </ControlsSection>

      {/* ─── SECTION: Health Checks ─── */}
      <ControlsSection
        title="Health Checks"
        description="Run diagnostics on your data"
        defaultExpanded={true}
      >
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
      </ControlsSection>

      {/* ─── SECTION: Audit & Notifications ─── */}
      <ControlsSection
        title="Audit & Notifications"
        description="Audit log cleanup and notification tasks"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Audit Cleanup"
          description="Delete old audit logs based on retention policy"
          onTrigger={triggerAuditCleanup}
          onFetchStatus={getAuditCleanupStatus}
          loading={loading}
          icon={<Database className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Overdue Reminders"
          description="Send overdue reminder emails to borrowers"
          onTrigger={triggerOverdueReminders}
          onFetchStatus={getOverdueRemindersStatus}
          loading={loading}
          icon={<Bell className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Notification Retry"
          description="Retry failed email/SMS notifications"
          onTrigger={triggerNotificationRetry}
          onFetchStatus={getNotificationRetryStatus}
          loading={loading}
          icon={<Mail className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* ─── SECTION: Borrowers ─── */}
      <ControlsSection
        title="Borrowers"
        description="Borrower management and maintenance"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Credit Score Recalc"
          description="Recalculate credit scores for all borrowers"
          onTrigger={() => triggerCreditScoreRecalc()}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "On-demand" })}
          loading={loading}
          icon={<Users className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Borrower Merge"
          description="Merge duplicate borrower records"
          onTrigger={triggerBorrowerMerge}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Weekly" })}
          loading={loading}
          icon={<Users className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Borrower Cleanup"
          description="Soft-delete incomplete borrowers"
          onTrigger={() => triggerBorrowerCleanup(30)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Monthly" })}
          loading={loading}
          icon={<Users className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Borrower Status Update"
          description="Update borrower active/inactive status"
          onTrigger={triggerBorrowerStatusUpdate}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Users className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* ─── SECTION: Groups ─── */}
      <ControlsSection
        title="Groups"
        description="Debtor group management"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Bulk Assign"
          description="Bulk assign debtors to a group"
          onTrigger={() => triggerBulkAssign(1, [])}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "On-demand" })}
          loading={loading}
          icon={<Users className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Auto Assign"
          description="Auto-assign debtors to groups based on rules"
          onTrigger={triggerAutoAssign}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Users className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Group Cleanup"
          description="Remove empty or inactive groups"
          onTrigger={triggerGroupCleanup}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Monthly" })}
          loading={loading}
          icon={<Users className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Group Stats Update"
          description="Recalculate group statistics"
          onTrigger={triggerGroupStatsUpdate}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Users className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* ─── SECTION: Loan Agreements ─── */}
      <ControlsSection
        title="Loan Agreements"
        description="Loan agreement management"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Agreement Cleanup"
          description="Delete old draft agreements"
          onTrigger={() => triggerAgreementCleanup(90)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Monthly" })}
          loading={loading}
          icon={<FileText className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Overdue Agreement Notify"
          description="Send notifications for overdue agreements"
          onTrigger={triggerOverdueAgreementNotify}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<FileText className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Auto Assign Agreements"
          description="Auto-assign agreements to debts"
          onTrigger={triggerAutoAssignAgreements}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<FileText className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Sync Agreement Status"
          description="Sync agreement status with debts"
          onTrigger={triggerSyncAgreementStatus}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<FileText className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* ─── SECTION: Loan Applications ─── */}
      <ControlsSection
        title="Loan Applications"
        description="Loan application processing"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Auto Approve"
          description="Auto-approve pending applications"
          onTrigger={triggerAutoApprove}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<FileText className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Stale Cleanup"
          description="Clean up stale applications"
          onTrigger={() => triggerStaleCleanup(30)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Monthly" })}
          loading={loading}
          icon={<FileText className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Pending Reminders"
          description="Send reminders for pending applications"
          onTrigger={triggerPendingReminders}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<FileText className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Bulk Import"
          description="Bulk import loan applications from CSV"
          onTrigger={triggerBulkImportApplications}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "On-demand" })}
          loading={loading}
          icon={<FileText className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* ─── SECTION: Payment Methods ─── */}
      <ControlsSection
        title="Payment Methods"
        description="Payment method management"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Stats Recalc"
          description="Recalculate payment method transaction stats"
          onTrigger={() => triggerPaymentMethodStatsRecalc()}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Weekly" })}
          loading={loading}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Method Cleanup"
          description="Delete unused payment methods"
          onTrigger={() => triggerPaymentMethodCleanup(180)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Monthly" })}
          loading={loading}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Method Report"
          description="Generate payment method usage report"
          onTrigger={triggerPaymentMethodReport}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Monthly" })}
          loading={loading}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Ensure Default"
          description="Ensure a default payment method exists"
          onTrigger={triggerEnsureDefaultMethod}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<CreditCard className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* ─── SECTION: Sync ─── */}
      <ControlsSection
        title="Sync System"
        description="Data sync maintenance and monitoring"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Sync Health Check"
          description="Check the health of the sync system"
          onTrigger={triggerSyncHealthCheck}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Database className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Queue Retry"
          description="Retry failed sync queue items"
          onTrigger={() => triggerSyncQueueRetry()}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Database className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Sync Cleanup"
          description="Clean up stale sync records"
          onTrigger={() => triggerSyncCleanup(90)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Weekly" })}
          loading={loading}
          icon={<Database className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Sync Report"
          description="Generate weekly sync activity report"
          onTrigger={() => triggerSyncReport(7)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Weekly" })}
          loading={loading}
          icon={<Database className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* ─── SECTION: System Settings ─── */}
      <ControlsSection
        title="System Settings"
        description="Settings management and maintenance"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Cache Refresh"
          description="Pre-load system settings into cache"
          onTrigger={() => triggerSettingsCacheRefresh()}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Settings className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Settings Validate"
          description="Validate system settings for consistency"
          onTrigger={() => triggerSettingsValidate()}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Settings className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Settings Backup"
          description="Back up all system settings to JSON"
          onTrigger={triggerSettingsBackup}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Weekly" })}
          loading={loading}
          icon={<Settings className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Settings Diff"
          description="Compare current settings with backup"
          onTrigger={triggerSettingsDiff}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "On-demand" })}
          loading={loading}
          icon={<Settings className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* ─── SECTION: Security ─── */}
      <ControlsSection
        title="Security"
        description="User security and monitoring"
        defaultExpanded={false}
      >
        <ControlsTaskCard
          title="Security Cleanup"
          description="Delete expired tokens, sessions, and logs"
          onTrigger={() => triggerSecurityCleanup(30)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Shield className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Security Monitor"
          description="Check for suspicious login activity"
          onTrigger={triggerSecurityMonitor}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Every 6 hours" })}
          loading={loading}
          icon={<Shield className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Auto Suspend"
          description="Suspend inactive users"
          onTrigger={() => triggerAutoSuspend(90)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Daily" })}
          loading={loading}
          icon={<Shield className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Orphan Cleanup"
          description="Delete users with no login/activity"
          onTrigger={() => triggerOrphanCleanup(30)}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Weekly" })}
          loading={loading}
          icon={<Shield className="w-5 h-5" />}
        />
        <ControlsTaskCard
          title="Security Report"
          description="Send weekly security digest to admins"
          onTrigger={triggerSecurityReport}
          onFetchStatus={() => Promise.resolve({ enabled: true, lastRun: null, isRunning: false, schedule: "Weekly" })}
          loading={loading}
          icon={<Shield className="w-5 h-5" />}
        />
      </ControlsSection>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-3">
        <p>Controls API v1.0 • {loading ? "⏳ Loading..." : "✅ Ready"}</p>
      </div>
    </div>
  );
};

export default ControlsPage;