// src/renderer/pages/Settings/components/NotificationsTab.tsx
import React, { useState } from "react";
import type { NotificationsSettings } from "../../../api/utils/system_config";
import Switch from "../../../components/UI/Switch";
import Select from "../../../components/UI/Select";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

interface Props {
  settings: NotificationsSettings;
  onUpdate: (field: keyof NotificationsSettings, value: any) => void;
  onTestSmtp: () => Promise<void>;
  onTestSms: () => Promise<void>;
}

const NotificationsTab: React.FC<Props> = ({ settings, onUpdate, onTestSmtp, onTestSms }) => {
  const [testing, setTesting] = useState<"smtp" | "sms" | null>(null);
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  const handleTest = async (type: "smtp" | "sms") => {
    setTesting(type);
    try {
      if (type === "smtp") await onTestSmtp();
      else await onTestSms();
    } finally { setTesting(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Notification Settings</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Email, SMS, and reminder preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Enable Email Notifications</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Send email alerts for events</p>
          </div>
          <Switch checked={settings.email_enabled || false} onChange={(checked) => onUpdate("email_enabled", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Enable SMS Notifications</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Send SMS alerts for events</p>
          </div>
          <Switch checked={settings.sms_enabled || false} onChange={(checked) => onUpdate("sms_enabled", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Notify debtor on payment received</label>
          </div>
          <Switch checked={settings.notify_on_payment || false} onChange={(checked) => onUpdate("notify_on_payment", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Notify debtor when penalty is applied</label>
          </div>
          <Switch checked={settings.notify_on_penalty || false} onChange={(checked) => onUpdate("notify_on_penalty", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Send overdue reminders</label>
          </div>
          <Switch checked={(settings.reminder_days_before_due?.length ?? 0) > 0} onChange={(checked) => { if (checked) onUpdate("reminder_days_before_due", [7, 3, 1]); else onUpdate("reminder_days_before_due", []); }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Reminder Days Before Due</label>
          <input type="text" value={Array.isArray(settings.reminder_days_before_due) ? settings.reminder_days_before_due.join(", ") : ""} onChange={(e) => { const days = e.target.value.split(",").map((d) => parseInt(d.trim(), 10)).filter((d) => !isNaN(d)); onUpdate("reminder_days_before_due", days); }} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="e.g., 7, 3, 1" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Overdue Notification Frequency</label>
          <Select value={settings.overdue_notification_frequency || "daily"} onChange={(val) => onUpdate("overdue_notification_frequency", val)} options={FREQUENCY_OPTIONS} placeholder="Select frequency" />
        </div>
      </div>

      {/* SMTP Settings */}
      <div className="border-t pt-5" style={{ borderColor: "var(--border-color)" }}>
        <h4 className="text-md font-medium mb-3" style={{ color: "var(--text-primary)" }}>Email (SMTP) Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>SMTP Host</label>
            <input type="text" value={settings.email_smtp_host || ""} onChange={(e) => onUpdate("email_smtp_host", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>SMTP Port</label>
            <input type="number" value={settings.email_smtp_port || 587} onChange={(e) => onUpdate("email_smtp_port", parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="587" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>From Address</label>
            <input type="email" value={settings.email_from_address || ""} onChange={(e) => onUpdate("email_from_address", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="noreply@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>SMTP Username</label>
            <input type="text" value={settings.email_smtp_username || ""} onChange={(e) => onUpdate("email_smtp_username", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>SMTP Password</label>
            <input type="password" value={settings.email_smtp_password || ""} onChange={(e) => onUpdate("email_smtp_password", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="••••••••" />
          </div>
          <div className="flex justify-end items-center">
            <button onClick={() => handleTest("smtp")} disabled={testing === "smtp"} className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5" style={{ backgroundColor: "var(--btn-secondary-bg)", color: "var(--btn-secondary-text)", border: "1px solid var(--btn-secondary-border)" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)"}>
              {testing === "smtp" ? ( <><span className="animate-spin h-3 w-3 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full" /> Testing...</> ) : ( "Test SMTP" )}
            </button>
          </div>
        </div>
      </div>

      {/* SMS Settings */}
      <div className="border-t pt-5" style={{ borderColor: "var(--border-color)" }}>
        <h4 className="text-md font-medium mb-3" style={{ color: "var(--text-primary)" }}>SMS (Twilio) Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>SMS Provider</label>
            <input type="text" value={settings.sms_provider || "twilio"} onChange={(e) => onUpdate("sms_provider", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="twilio" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Account SID</label>
            <input type="text" value={settings.twilio_account_sid || ""} onChange={(e) => onUpdate("twilio_account_sid", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Auth Token</label>
            <input type="password" value={settings.twilio_auth_token || ""} onChange={(e) => onUpdate("twilio_auth_token", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Phone Number</label>
            <input type="text" value={settings.twilio_phone_number || ""} onChange={(e) => onUpdate("twilio_phone_number", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="+1234567890" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Messaging Service SID</label>
            <input type="text" value={settings.twilio_messaging_service_sid || ""} onChange={(e) => onUpdate("twilio_messaging_service_sid", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} />
          </div>
          <div className="flex justify-end items-center">
            <button onClick={() => handleTest("sms")} disabled={testing === "sms"} className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5" style={{ backgroundColor: "var(--btn-secondary-bg)", color: "var(--btn-secondary-text)", border: "1px solid var(--btn-secondary-border)" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)"}>
              {testing === "sms" ? ( <><span className="animate-spin h-3 w-3 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full" /> Testing...</> ) : ( "Test SMS" )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;