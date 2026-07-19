// src/main/ipc/utils/server_config/update_grouped.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { configData } = params;
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  // ✅ Convert grouped object to array format expected by backend
   const settingsArray = [];
  Object.entries(configData).forEach(([category, settings]) => {
    if (settings && typeof settings === "object") {
      Object.entries(settings).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          settingsArray.push({
            key,
            value,
            setting_type: category,
            description: `Setting for ${category}.${key}`,
            is_public: false,
          });
        }
      });
    }
  });

  if (settingsArray.length === 0) {
    return {
      status: false,
      message: "No settings to update",
      data: null,
    };
  }

  const response = await onlineClient.post("/api/v1/system_settings/bulk-update/", {
    settings: settingsArray
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();

  return {
    status: result.status || false,
    message: result.message || "Grouped config updated",
    data: result.data || {},
  };
};