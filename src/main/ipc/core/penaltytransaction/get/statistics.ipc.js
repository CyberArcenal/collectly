// src/main/ipc/core/penaltytransaction/get/statistics.ipc.js
//@ts-check
const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData, transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get('/api/v1/payments/penalties/stats/');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    const stats = transformKeysToCamelCase(serverResult);
    console.log("Retrieved statistics from server:", stats);
    return {
      status: true,
      message: stats.message || "Statistics retrieved from server",
      data: stats.data,
    };
  } else {
    const stats = await penaltyTransactionService.getStatistics();
    return {
      status: true,
      message: "Statistics retrieved locally",
      data: stats,
    };
  }
};