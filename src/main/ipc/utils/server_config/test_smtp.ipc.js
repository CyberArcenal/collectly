// src/main/ipc/utils/server_config/test_smtp.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { settings } = params;
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const response = await onlineClient.post("/api/v1/system_settings/test/smtp/", settings);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();

  return {
    status: result.status || false,
    message: result.message || "SMTP test completed",
    data: result.data || null,
  };
};