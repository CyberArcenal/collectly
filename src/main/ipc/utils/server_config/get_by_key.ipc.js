// src/main/ipc/utils/server_config/get_by_key.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { key, settingType } = params;
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const query = {};
  if (settingType) query.setting_type = settingType;

  const response = await onlineClient.get(`/api/v1/system_settings/${key}/`, { params: query });
  if (response.status === 404) {
    return { status: true, message: "Not found", data: null };
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();
  
  return {
    status: true,
    message: "Setting retrieved from server",
    data: result.data || null,
  };
};