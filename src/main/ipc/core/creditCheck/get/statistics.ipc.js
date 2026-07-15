// src/main/ipc/core/creditCheck/get/statistics.ipc.js
//@ts-check
const creditCheckService = require("../../../../../services/CreditCheck");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");
const { transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");

/**
 * @typedef {object} CreditCheckStatisticsParams
 * @property {string} [startDate]
 * @property {string} [endDate]
 */

/**
 * @typedef {object} StatisticsQueryParams
 * @property {string} [start_date]
 * @property {string} [end_date]
 */

/**
 * @typedef {object} CreditCheckStatisticsResult
 * @property {string} [message]
 * @property {any} [data]
 */

/**
 * @typedef {object} StatisticsResponse
 * @property {boolean} status
 * @property {string} message
 * @property {any} data
 */

/** @type {(params: CreditCheckStatisticsParams) => Promise<StatisticsResponse>} */
module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Build query string from filters
    const query = {};
    if (params.startDate) query.start_date = params.startDate;
    if (params.endDate) query.end_date = params.endDate;

    const response = await onlineClient.get("/api/v1/borrowers/credit-checks/statistics/", { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    // Ensure camelCase keys
    const stats = transformKeysToCamelCase(serverResult);

    return {
      status: true,
      message: stats.message || "Statistics retrieved successfully",
      data: stats.data || {},
    };
  } else {
    // Offline
    const stats = await creditCheckService.getStatistics(params);
    return {
      status: true,
      message: "Statistics retrieved locally",
      data: stats,
    };
  }
};