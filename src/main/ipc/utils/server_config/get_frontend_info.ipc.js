// src/main/ipc/utils/server_config/get_frontend_info.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");

module.exports = async () => {
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const [systemInfoRes, publicSettingsRes] = await Promise.all([
    onlineClient.get("/api/v1/system_settings/system-info/"),
    onlineClient.get("/api/v1/system_settings/public/"),
  ]);

  if (!systemInfoRes.ok) {
    const errorText = await systemInfoRes.text();
    throw new Error(`Server error: ${systemInfoRes.status} - ${errorText}`);
  }
  if (!publicSettingsRes.ok) {
    const errorText = await publicSettingsRes.text();
    throw new Error(`Server error: ${publicSettingsRes.status} - ${errorText}`);
  }

  const systemInfo = await systemInfoRes.json();
  const publicSettings = await publicSettingsRes.json();

  return {
    status: true,
    message: "Frontend system info retrieved from server",
    data: {
      system_info: transformKeysToCamelCase(systemInfo.data || {}),
      public_settings: transformKeysToCamelCase(publicSettings.data || {}),
      cache_timestamp: new Date().toISOString(),
    },
  };
};