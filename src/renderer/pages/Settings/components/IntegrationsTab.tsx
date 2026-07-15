// src/renderer/pages/Settings/components/IntegrationsTab.tsx
import React from "react";
import type { IntegrationsSettings } from "../../../api/utils/system_config";
import Switch from "../../../components/UI/Switch";

interface Props {
  settings: IntegrationsSettings;
  onUpdate: (field: keyof IntegrationsSettings, value: any) => void;
}

const IntegrationsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Integrations Settings</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Connect with external services and APIs</p>
      </div>

      {/* Accounting Integration */}
      <div className="border rounded-lg p-4 space-y-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Accounting Integration</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Sync with accounting software</p>
          </div>
          <Switch checked={settings.accounting_integration_enabled || false} onChange={(checked) => onUpdate("accounting_integration_enabled", checked)} />
        </div>
        {settings.accounting_integration_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>API URL</label>
              <input type="url" value={settings.accounting_api_url || ""} onChange={(e) => onUpdate("accounting_api_url", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="https://api.accounting.com/v1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>API Key</label>
              <input type="password" value={settings.accounting_api_key || ""} onChange={(e) => onUpdate("accounting_api_key", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="••••••••" />
            </div>
          </div>
        )}
      </div>

      {/* Credit Bureau */}
      <div className="border rounded-lg p-4 space-y-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Credit Bureau Integration</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Check credit scores from external bureaus</p>
          </div>
          <Switch checked={settings.credit_bureau_api_enabled || false} onChange={(checked) => onUpdate("credit_bureau_api_enabled", checked)} />
        </div>
        {settings.credit_bureau_api_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>API Endpoint</label>
              <input type="url" value={settings.credit_bureau_endpoint || ""} onChange={(e) => onUpdate("credit_bureau_endpoint", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="https://api.creditbureau.com/v1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>API Key</label>
              <input type="password" value={settings.credit_bureau_api_key || ""} onChange={(e) => onUpdate("credit_bureau_api_key", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="••••••••" />
            </div>
          </div>
        )}
      </div>

      {/* Webhooks */}
      <div className="border rounded-lg p-4 space-y-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Webhooks</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Send events to external services</p>
          </div>
          <Switch checked={settings.webhooks_enabled || false} onChange={(checked) => onUpdate("webhooks_enabled", checked)} />
        </div>
        {settings.webhooks_enabled && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Webhook URLs (comma separated)</label>
            <input type="text" value={Array.isArray(settings.webhooks) ? settings.webhooks.join(", ") : ""} onChange={(e) => { const urls = e.target.value.split(",").map((u) => u.trim()).filter(Boolean); onUpdate("webhooks", urls); }} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="https://webhook.site/xxx, https://example.com/webhook" />
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsTab;