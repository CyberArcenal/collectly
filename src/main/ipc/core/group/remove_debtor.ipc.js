// src/main/ipc/group/remove_debtor.ipc.js
const groupService = require("../../../../services/Group");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { groupId, debtorId, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: DELETE /api/v1/groups/group-members/?group_id={groupId}&debtor_id={debtorId}
    const response = await onlineClient.delete('/api/v1/groups/group-members/', {
      params: { group_id: groupId, debtor_id: debtorId }
    });
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return {
      status: true,
      message: "Debtor removed on server",
      data: null,
    };
  } else {
    await groupService.removeDebtorFromGroup(groupId, debtorId, user, queryRunner);
    return {
      status: true,
      message: "Debtor removed locally",
      data: null,
    };
  }
};