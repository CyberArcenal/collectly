// src/main/ipc/group/assign_debtor.ipc.js
const groupService = require("../../../../services/Group");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { groupId, debtorId, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/groups/group-members/
    // Request body: { group_id, debtor_id }
    const response = await onlineClient.post('/api/v1/groups/group-members/', {
      group_id: groupId,
      debtor_id: debtorId,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Debtor assigned on server",
      data: extractData(serverResult) ?? null,
    };
  } else {
    const result = await groupService.assignDebtorToGroup(groupId, debtorId, user, queryRunner);
    return {
      status: true,
      message: "Debtor assigned locally",
      data: result ?? null,
    };
  }
};