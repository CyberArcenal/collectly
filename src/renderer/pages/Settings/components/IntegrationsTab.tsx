// src/renderer/pages/Settings/components/IntegrationsTab.tsx
import React, { useState } from "react";
import type {
  IntegrationsSettings,
  WebhookSetting,
} from "../../../api/utils/system_config";
import Switch from "../../../components/UI/Switch";
import Button from "../../../components/UI/Button";
import Select from "../../../components/UI/Select";

const PAYMENT_PROVIDERS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "square", label: "Square" },
  { value: "authorize_net", label: "Authorize.Net" },
  { value: "braintree", label: "Braintree" },
  { value: "adyen", label: "Adyen" },
  { value: "other", label: "Other (specify below)" },
];

interface Props {
  settings: IntegrationsSettings;
  onUpdate: (field: keyof IntegrationsSettings, value: any) => void;
}

const IntegrationsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const [webhooks, setWebhooks] = useState<WebhookSetting[]>(() => {
    return Array.isArray(settings.webhooks) ? settings.webhooks : [];
  });

  const handleWebhookChange = (
    index: number,
    field: keyof WebhookSetting,
    value: any,
  ) => {
    const updated = [...webhooks];
    updated[index] = { ...updated[index], [field]: value };
    setWebhooks(updated);
    onUpdate("webhooks", updated);
  };

  const addWebhook = () => {
    const newWebhook: WebhookSetting = {
      url: "",
      events: [],
      enabled: true,
      secret: "",
    };
    const updated = [...webhooks, newWebhook];
    setWebhooks(updated);
    onUpdate("webhooks", updated);
  };

  const removeWebhook = (index: number) => {
    const updated = webhooks.filter((_, i) => i !== index);
    setWebhooks(updated);
    onUpdate("webhooks", updated);
  };

  const isOtherProvider =
    settings.payment_gateway_provider &&
    !PAYMENT_PROVIDERS.some(
      (p) => p.value === settings.payment_gateway_provider,
    ) &&
    settings.payment_gateway_provider !== "other";

  const selectValue = isOtherProvider
    ? "other"
    : settings.payment_gateway_provider || "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Integrations Settings</h3>
        <p className="text-sm text-[var(--text-secondary)]">Connect external services and APIs</p>
      </div>

      {/* Payment Gateway */}
      <div className="border border-[var(--border-color)] rounded-lg p-5 bg-[var(--card-secondary-bg)]">
        <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">Payment Gateway</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="payment_gateway_enabled" className="text-sm font-medium text-[var(--text-primary)]">
                  Enable Payment Gateway
                </label>
                <p className="text-xs text-[var(--text-tertiary)]">Accept online payments via third‑party providers</p>
              </div>
              <Switch
                checked={settings.payment_gateway_enabled || false}
                onChange={(checked) => onUpdate("payment_gateway_enabled", checked)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Provider
            </label>
            <Select
              value={selectValue}
              onChange={(val) => {
                if (val === "other") {
                  // Keep the current custom value
                  onUpdate("payment_gateway_provider", settings.payment_gateway_provider || "");
                } else {
                  onUpdate("payment_gateway_provider", val);
                }
              }}
              options={PAYMENT_PROVIDERS}
              placeholder="Select a provider"
              disabled={!settings.payment_gateway_enabled}
            />
          </div>
          {(selectValue === "other" || isOtherProvider) && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Custom Provider Name
              </label>
              <input
                type="text"
                value={settings.payment_gateway_provider || ""}
                onChange={(e) => onUpdate("payment_gateway_provider", e.target.value)}
                className="windows-input w-full"
                placeholder="e.g., MyCustomGateway"
                disabled={!settings.payment_gateway_enabled}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              API Key
            </label>
            <input
              type="password"
              value={settings.payment_gateway_api_key || ""}
              onChange={(e) => onUpdate("payment_gateway_api_key", e.target.value)}
              className="windows-input w-full"
              placeholder="••••••••••••••••"
              disabled={!settings.payment_gateway_enabled}
            />
          </div>
        </div>
      </div>

      {/* Webhooks section remains unchanged (no selects) */}
      <div className="border border-[var(--border-color)] rounded-lg p-5 bg-[var(--card-secondary-bg)]">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-medium text-[var(--text-primary)]">Webhooks</h4>
          <Button variant="secondary" size="sm" onClick={addWebhook}>
            + Add Webhook
          </Button>
        </div>
        <div className="space-y-4">
          {webhooks.length > 0 ? (
            webhooks.map((webhook, index) => (
              <div
                key={index}
                className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--card-bg)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex justify-between items-start">
                    <h5 className="text-sm font-medium text-[var(--text-primary)]">
                      Webhook #{index + 1}
                    </h5>
                    <button
                      onClick={() => removeWebhook(index)}
                      className="text-[var(--danger-color)] hover:text-[var(--danger-hover)] text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      value={webhook.url}
                      onChange={(e) =>
                        handleWebhookChange(index, "url", e.target.value)
                      }
                      className="windows-input w-full"
                      placeholder="https://example.com/webhook"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Events (comma separated)
                    </label>
                    <input
                      type="text"
                      value={webhook.events.join(", ")}
                      onChange={(e) =>
                        handleWebhookChange(
                          index,
                          "events",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      className="windows-input w-full"
                      placeholder="sale.created, inventory.updated"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor={`webhook_enabled_${index}`} className="text-sm font-medium text-[var(--text-primary)]">
                      Enabled
                    </label>
                    <Switch
                      checked={webhook.enabled}
                      onChange={(checked) =>
                        handleWebhookChange(index, "enabled", checked)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Secret (optional)
                    </label>
                    <input
                      type="text"
                      value={webhook.secret || ""}
                      onChange={(e) =>
                        handleWebhookChange(index, "secret", e.target.value)
                      }
                      className="windows-input w-full"
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-secondary)] italic">No webhooks configured.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsTab;