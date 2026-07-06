// src/main/ipc/group/get/members.ipc.js
const groupService = require("../../../../../services/Group");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { groupId, page, limit } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/groups/group-members/ with query param group_id
    const query = { group_id: groupId };
    if (page) query.page = page;
    if (limit) query.page_size = limit;
    const response = await onlineClient.get('/api/v1/groups/group-members/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await groupService.getGroupMembers(groupId, page, limit);
    return {
      status: true,
      message: "Group members retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};