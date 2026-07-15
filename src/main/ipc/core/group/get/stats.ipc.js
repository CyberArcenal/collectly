// src/main/ipc/group/get/stats.ipc.js
const groupService = require("../../../../../services/Group");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { groupId } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/groups/stats/?group_id={groupId}
    const response = await onlineClient.get('/api/v1/groups/stats/', { params: { group_id: groupId } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Group stats retrieved from server",
      data: extractData(serverResult), // { memberCount, totalDebt, activeMembersCount }
    };
  } else {
    const stats = await groupService.getGroupStats(groupId);
    return {
      status: true,
      message: "Group stats retrieved locally",
      data: stats,
    };
  }
};