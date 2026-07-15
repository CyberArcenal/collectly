// src/main/ipc/creditCheck/delete_log.ipc.js
const creditCheckService = require("../../../../services/CreditCheck");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { logId, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: DELETE /api/v1/borrowers/credit-checks/{id}/
    const response = await onlineClient.delete(`/api/v1/borrowers/credit-checks/${logId}/`);
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return {
      status: true,
      message: "Credit check log deleted on server",
      data: null,
    };
  } else {
    await creditCheckService.deleteCreditCheckLog(logId, user, queryRunner);
    return {
      status: true,
      message: "Credit check log deleted locally",
      data: null,
    };
  }
};