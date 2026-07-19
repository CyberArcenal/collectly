// src/main/ipc/utils/server_config/get_by_type.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { settingType } = params;
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const response = await onlineClient.get(`/api/v1/system_settings/`, {
    params: { setting_type: settingType }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();
  
  return {
    status: true,
    message: "Settings by type retrieved from server",
    data: transformKeysToCamelCase(result.data || []),
  };
};