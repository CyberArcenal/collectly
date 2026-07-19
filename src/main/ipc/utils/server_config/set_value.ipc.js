// src/main/ipc/utils/server_config/set_value.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { key, value, options } = params;
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const payload = {
    value,
    setting_type: options?.setting_type || "general",
    description: options?.description || `Setting for ${key}`,
    is_public: options?.isPublic || false,
  };

  // Try to update existing, fallback to create
  const response = await onlineClient.patch(`/api/v1/system_settings/${key}/`, payload);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();

  return {
    status: result.status || false,
    message: result.message || "Value set",
    data: result.data || null,
  };
};