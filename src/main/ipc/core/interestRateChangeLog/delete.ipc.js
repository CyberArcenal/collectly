// src/main/ipc/core/interestRateChangeLog/delete.ipc.js
const interestRateChangeLogService = require("../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, userId } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: DELETE /api/v1/debts/interest-rate-changes/{id}/
    const response = await onlineClient.delete(`/api/v1/debts/interest-rate-changes/${id}/`);
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return {
      status: true,
      message: "Log deleted on server",
      data: null,
    };
  } else {
    await interestRateChangeLogService.deleteLog(id, userId, queryRunner);
    return {
      status: true,
      message: "Log deleted locally",
      data: null,
    };
  }
};