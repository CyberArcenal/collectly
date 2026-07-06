// src/main/ipc/group/clear_members.ipc.js
const groupService = require("../../../../services/Group");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { groupId, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: DELETE /api/v1/groups/{group_id}/clear-members/
    const response = await onlineClient.delete(`/api/v1/groups/${groupId}/clear-members/`);
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return {
      status: true,
      message: "Group members cleared on server",
      data: null,
    };
  } else {
    await groupService.clearGroupMembers(groupId, user, queryRunner);
    return {
      status: true,
      message: "Group members cleared locally",
      data: null,
    };
  }
};