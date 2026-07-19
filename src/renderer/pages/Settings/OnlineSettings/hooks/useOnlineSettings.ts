// src/renderer/pages/Settings/OnlineSettings/hooks/useOnlineSettings.ts
import { useState, useEffect, useCallback } from "react";
import onlineSystemConfigAPI from "../../../../api/utils/online_system_config";
import type {
  SystemInfoData,
  GeneralSettings,
  CollectionsSettings,
  LoanSettings,
  NotificationsSettings,
  ReportsSettings,
  IntegrationsSettings,
  AuditSecuritySettings,
} from "../../../../api/utils/system_config";
import { dialogs } from "../../../../utils/dialogs";

// ========== Default values for each category ==========
const DEFAULT_GENERAL: GeneralSettings = {
  company_name: "",
  sync_mode: "offline_first",
  branch_location: "",
  default_timezone: "Asia/Manila",
  currency: "PHP",
  language: "en",
  receipt_footer_message: "",
  auto_logout_minutes: 30,
  date_format: "YYYY-MM-DD",
};

const DEFAULT_COLLECTIONS: CollectionsSettings = {
  default_interest_rate: 10,
  default_penalty_rate: 2,
  penalty_calculation_method: "percentage",
  interest_calculation_period: "per_annum",
  enable_auto_penalty: true,
  penalty_grace_days: 0,
  overdue_reminder_days: [7, 3, 1],
  max_loan_amount: 0,
  min_loan_amount: 0,
  enforce_credit_check: false,
};

const DEFAULT_LOANS: LoanSettings = {
  allowed_loan_statuses: ["active", "paid", "overdue", "defaulted"],
  enable_partial_payment: true,
  enable_early_payment_discount: false,
  early_payment_discount_rate: 0,
  require_loan_agreement: false,
  loan_agreement_template: "",
  amortization_type: "flat",
  default_loan_term_months: 12,
};

const DEFAULT_NOTIFICATIONS: NotificationsSettings = {
  email_enabled: false,
  email_smtp_host: "",
  email_smtp_port: 587,
  email_from_address: "",
  email_smtp_username: "",
  email_smtp_password: "",
  sms_enabled: false,
  sms_provider: "twilio",
  reminder_days_before_due: [7, 3, 1],
  overdue_notification_frequency: "daily",
  notify_on_payment: true,
  notify_on_penalty: true,
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_phone_number: "",
  twilio_messaging_service_sid: "",
};

const DEFAULT_REPORTS: ReportsSettings = {
  export_formats: ["CSV", "Excel", "PDF"],
  default_export_format: "CSV",
  auto_backup_enabled: false,
  backup_schedule: "0 2 * * *",
  backup_location: "./backups",
  data_retention_days: 365,
  include_audit_in_backup: false,
};

const DEFAULT_INTEGRATIONS: IntegrationsSettings = {
  accounting_integration_enabled: false,
  accounting_api_url: "",
  accounting_api_key: "",
  credit_bureau_api_enabled: false,
  credit_bureau_api_key: "",
  credit_bureau_endpoint: "",
  webhooks_enabled: false,
  webhooks: [],
};

const DEFAULT_AUDIT_SECURITY: AuditSecuritySettings = {
  audit_log_enabled: true,
  log_retention_days: 30,
  log_events: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"],
  force_https: false,
  session_encryption_enabled: true,
  gdpr_compliance_enabled: false,
  require_mfa_for_admin: false,
};

const DEFAULTS = {
  general: DEFAULT_GENERAL,
  collections: DEFAULT_COLLECTIONS,
  loans: DEFAULT_LOANS,
  notifications: DEFAULT_NOTIFICATIONS,
  reports: DEFAULT_REPORTS,
  integrations: DEFAULT_INTEGRATIONS,
  audit_security: DEFAULT_AUDIT_SECURITY,
};

// Allowed keys per category
const ALLOWED_KEYS: Record<keyof typeof DEFAULTS, string[]> = {
  general: [
    "company_name",
    "sync_mode",
    "server_url",
    "branch_location",
    "default_timezone",
    "currency",
    "language",
    "receipt_footer_message",
    "auto_logout_minutes",
    "date_format",
  ],
  collections: [
    "default_interest_rate",
    "default_penalty_rate",
    "interest_calculation_period",
    "penalty_calculation_method",
    "enable_auto_penalty",
    "penalty_grace_days",
    "overdue_reminder_days",
    "max_loan_amount",
    "min_loan_amount",
    "enforce_credit_check",
  ],
  loans: [
    "allowed_loan_statuses",
    "enable_partial_payment",
    "enable_early_payment_discount",
    "early_payment_discount_rate",
    "require_loan_agreement",
    "loan_agreement_template",
    "amortization_type",
    "default_loan_term_months",
  ],
  notifications: [
    "email_enabled",
    "email_smtp_host",
    "email_smtp_port",
    "email_from_address",
    "email_smtp_username",
    "email_smtp_password",
    "sms_enabled",
    "sms_provider",
    "reminder_days_before_due",
    "overdue_notification_frequency",
    "notify_on_payment",
    "notify_on_penalty",
    "twilio_account_sid",
    "twilio_auth_token",
    "twilio_phone_number",
    "twilio_messaging_service_sid",
  ],
  reports: [
    "export_formats",
    "default_export_format",
    "auto_backup_enabled",
    "backup_schedule",
    "backup_location",
    "data_retention_days",
    "include_audit_in_backup",
  ],
  integrations: [
    "accounting_integration_enabled",
    "accounting_api_url",
    "accounting_api_key",
    "credit_bureau_api_enabled",
    "credit_bureau_api_key",
    "credit_bureau_endpoint",
    "webhooks_enabled",
    "webhooks",
  ],
  audit_security: [
    "audit_log_enabled",
    "log_retention_days",
    "log_events",
    "force_https",
    "session_encryption_enabled",
    "gdpr_compliance_enabled",
    "require_mfa_for_admin",
  ],
};

function sanitizeSettings<T extends Record<string, any>>(
  obj: T,
  allowedKeys: string[],
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of allowedKeys) {
    if (key in obj) {
      result[key as keyof T] = obj[key];
    }
  }
  return result;
}

export const useOnlineSettings = () => {
  const [groupedConfig, setGroupedConfig] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ✅ Fetch settings with optional silent mode (no spinner)
  const fetchSettings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await onlineSystemConfigAPI.getGroupedConfig();

      if (response.status && response.data) {
        const grouped = response.data;

        setGroupedConfig({
          general: { ...DEFAULTS.general, ...grouped.general },
          collections: { ...DEFAULTS.collections, ...grouped.collections },
          loans: { ...DEFAULTS.loans, ...grouped.loans },
          notifications: { ...DEFAULTS.notifications, ...grouped.notifications },
          reports: { ...DEFAULTS.reports, ...grouped.reports },
          integrations: { ...DEFAULTS.integrations, ...grouped.integrations },
          audit_security: { ...DEFAULTS.audit_security, ...grouped.audit_security },
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load settings from server");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ✅ Silent refresh function (no spinner, no global context)
  const refreshSilent = useCallback(() => fetchSettings(true), [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateCategoryField = useCallback(
    <C extends keyof typeof DEFAULTS>(
      category: C,
      field: keyof (typeof DEFAULTS)[C],
      value: any,
    ) => {
      setGroupedConfig((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        },
      }));
    },
    [],
  );

  const updateGeneral = (field: keyof GeneralSettings, value: any) =>
    updateCategoryField("general", field, value);
  const updateCollections = (field: keyof CollectionsSettings, value: any) =>
    updateCategoryField("collections", field, value);
  const updateLoans = (field: keyof LoanSettings, value: any) =>
    updateCategoryField("loans", field, value);
  const updateNotifications = (field: keyof NotificationsSettings, value: any) =>
    updateCategoryField("notifications", field, value);
  const updateReports = (field: keyof ReportsSettings, value: any) =>
    updateCategoryField("reports", field, value);
  const updateIntegrations = (field: keyof IntegrationsSettings, value: any) =>
    updateCategoryField("integrations", field, value);
  const updateAuditSecurity = (field: keyof AuditSecuritySettings, value: any) =>
    updateCategoryField("audit_security", field, value);

  // ✅ Save settings – silent refresh only (no global context refresh)
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const combinedConfig: Record<string, any> = {};
    const categories = Object.keys(groupedConfig) as Array<keyof typeof DEFAULTS>;

    for (const category of categories) {
      const dataToSend = sanitizeSettings(
        groupedConfig[category],
        ALLOWED_KEYS[category],
      );
      if (Object.keys(dataToSend).length > 0) {
        combinedConfig[category] = dataToSend;
      }
    }

    try {
      const response = await onlineSystemConfigAPI.updateGroupedConfig(combinedConfig);
      if (response.status) {
        setSuccessMessage("All server settings saved successfully");
        // ✅ Silent refresh – no full-page spinner, no global context
        await refreshSilent();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save server settings");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    const confirmed = await dialogs.confirm({
      message:
        "Are you sure you want to reset all server settings to default values? This cannot be undone.",
      title: "Reset Server Settings",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const resetData: Record<string, any> = {};
      for (const category of Object.keys(DEFAULTS) as Array<keyof typeof DEFAULTS>) {
        resetData[category] = DEFAULTS[category];
      }
      const response = await onlineSystemConfigAPI.updateGroupedConfig(resetData);
      if (response.status) {
        setSuccessMessage("Server settings reset to defaults");
        await fetchSettings();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset server settings");
    } finally {
      setLoading(false);
    }
  };

  const exportSettings = async () => {
    try {
      const response = await onlineSystemConfigAPI.getGroupedConfig();
      if (response.status && response.data) {
        const jsonStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `server-settings-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccessMessage("Server settings exported successfully");
      }
    } catch (err: any) {
      setError(err.message || "Failed to export server settings");
    }
  };

  const importSettings = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        const updates: Record<string, any> = {};
        for (const category of Object.keys(DEFAULTS) as Array<keyof typeof DEFAULTS>) {
          if (data[category] && typeof data[category] === "object") {
            updates[category] = sanitizeSettings(
              data[category],
              ALLOWED_KEYS[category],
            );
          }
        }

        const response = await onlineSystemConfigAPI.updateGroupedConfig(updates);
        if (response.status) {
          setSuccessMessage("Server settings imported successfully");
          await fetchSettings();
        } else {
          throw new Error(response.message);
        }
      } catch (err: any) {
        setError(err.message || "Failed to import server settings");
      }
    };
    reader.readAsText(file);
  };

  const testSmtpConnection = async () => {
    try {
      const response = await onlineSystemConfigAPI.testSmtpConnection(
        groupedConfig.notifications,
      );
      if (response.status) {
        setSuccessMessage("SMTP connection successful");
      } else {
        setError(response.message || "SMTP connection failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to test SMTP connection");
    }
  };

  const testSmsConnection = async () => {
    try {
      const response = await onlineSystemConfigAPI.testSmsConnection(
        groupedConfig.notifications,
      );
      if (response.status) {
        setSuccessMessage("SMS connection successful");
      } else {
        setError(response.message || "SMS connection failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to test SMS connection");
    }
  };

  return {
    groupedConfig,
    loading,
    saving,
    error,
    successMessage,
    setError,
    setSuccessMessage,
    updateGeneral,
    updateCollections,
    updateLoans,
    updateNotifications,
    updateReports,
    updateIntegrations,
    updateAuditSecurity,
    saveSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    refetch: fetchSettings,
    testSmtpConnection,
    testSmsConnection,
  };
};