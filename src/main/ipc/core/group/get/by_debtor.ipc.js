// src/main/ipc/group/get/by_debtor.ipc.js
const groupService = require("../../../../../services/Group");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { debtorId, page, limit } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/groups/by-debtor/${debtorId}`, { params: { page, limit } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await groupService.getGroupsForDebtor(debtorId, page, limit);
    return {
      status: true,
      message: "Groups for debtor retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};