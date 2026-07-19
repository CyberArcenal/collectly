// src/main/ipc/utils/server_config/get_all.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const query = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.page_size = params.limit;
  if (params.settingType) query.setting_type = params.settingType;
  if (params.search) query.search = params.search;
  if (params.includeDeleted !== undefined) query.include_deleted = params.includeDeleted;

  const response = await onlineClient.get("/api/v1/system_settings/", { params: query });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }
  const result = await response.json();
  
  return {
    status: true,
    message: "Settings retrieved from server",
    data: transformKeysToCamelCase(result.data || []),
    pagination: result.pagination,
  };
};