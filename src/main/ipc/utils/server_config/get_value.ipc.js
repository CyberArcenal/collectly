// src/main/ipc/utils/server_config/get_value.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { key, defaultValue } = params;
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const response = await onlineClient.get(`/api/v1/system_settings/${key}/`);
  if (response.status === 404) {
    return { status: true, message: "Not found", data: defaultValue };
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();
  
  return {
    status: true,
    message: "Value retrieved from server",
    data: result.data?.value !== undefined ? result.data.value : defaultValue,
  };
};