// src/main/ipc/core/interestRateChangeLog/get/statistics.ipc.js
//@ts-check
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");
const { transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = {};
    if (params.startDate) query.start_date = params.startDate;
    if (params.endDate) query.end_date = params.endDate;

    const response = await onlineClient.get("/api/v1/debts/interest-rate-changes/stats/", { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const stats = transformKeysToCamelCase(serverResult);

    // Transform nested arrays
    if (stats.changesByUser) {
      stats.changesByUser = stats.changesByUser.map(u => transformKeysToCamelCase(u));
    }
    if (stats.changesByLoan) {
      stats.changesByLoan = stats.changesByLoan.map(l => transformKeysToCamelCase(l));
    }
    if (stats.mostFrequentSetting) {
      stats.mostFrequentSetting = transformKeysToCamelCase(stats.mostFrequentSetting);
    }

    return {
      status: true,
      message: "Statistics retrieved from server",
      data: stats,
    };
  } else {
    // Offline
    const stats = await interestRateChangeLogService.getStatistics(params);
    return {
      status: true,
      message: "Statistics retrieved locally",
      data: stats,
    };
  }
};