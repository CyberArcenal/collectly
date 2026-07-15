// src/main/ipc/debt/get/statistics.ipc.js
//@ts-check
const debtService = require("../../../../../services/Debt");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");
const { extractData, transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    // Endpoint: GET /api/v1/debts/stats/
    const response = await onlineClient.get('/api/v1/debts/stats/');
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
    const stats = await debtService.getStatistics();
    return {
      status: true,
      message: "Statistics retrieved locally",
      data: stats,
    };
  }
};