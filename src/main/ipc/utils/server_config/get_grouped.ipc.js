// src/main/ipc/utils/server_config/get_grouped.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const response = await onlineClient.get("/api/v1/system_settings/grouped/");
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();

  return {
    status: true,
    message: "Grouped settings retrieved from server",
    // ✅ NO transformation – keep snake_case keys
    data: result.data || {},
  };
};