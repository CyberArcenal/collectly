// src/main/ipc/core/interestRateChangeLog/get/all.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { filters, page = 1, limit = 50 } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/interest-rate-logs', { params: { filters, page, limit } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await interestRateChangeLogService.getAllLogs(filters, page, limit);
    return {
      status: true,
      message: "Logs retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};