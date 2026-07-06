// src/main/ipc/group/bulk_assign.ipc.js
const groupService = require("../../../../services/Group");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { groupId, debtorIds, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/groups/{group_id}/bulk-assign/
    // Request body: { debtorIds }
    const response = await onlineClient.post(`/api/v1/groups/${groupId}/bulk-assign/`, { debtorIds });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Bulk assign completed on server",
      data: extractData(serverResult), // { assignedCount }
    };
  } else {
    const result = await groupService.bulkAssignDebtors(groupId, debtorIds, user, queryRunner);
    return {
      status: true,
      message: "Bulk assign completed locally",
      data: result, // { assignedCount }
    };
  }
};