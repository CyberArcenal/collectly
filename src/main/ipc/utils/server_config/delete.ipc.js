// src/main/ipc/utils/server_config/delete.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { id } = params;
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const response = await onlineClient.delete(`/api/v1/system_settings/${id}/`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();

  return {
    status: result.status || false,
    message: result.message || "Setting deleted",
    data: result.data || null,
  };
};