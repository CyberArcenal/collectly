// src/main/ipc/group/get/all.ipc.js
const groupService = require("../../../../../services/Group");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/groups/
 */
function mapGroupParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapGroupParams(params);
    const response = await onlineClient.get('/api/v1/groups/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const { page, limit, search } = params;
    const result = await groupService.getAllGroups(page, limit, search);
    return {
      status: true,
      message: "Groups retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};