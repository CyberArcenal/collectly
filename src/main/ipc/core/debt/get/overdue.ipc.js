// src/main/ipc/core/debt/get/overdue.ipc.js
//@ts-check
const debtService = require("../../../../../services/Debt");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");
const {
  transformPaginatedResult,
  transformKeysToCamelCase,
} = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/debts/overdue/
 */
function mapOverdueParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  if (params.sortBy) mapped.sort_by = params.sortBy;
  if (params.sortOrder) mapped.sort_order = params.sortOrder;
  if (params.minDaysOverdue) mapped.min_days_overdue = params.minDaysOverdue;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapOverdueParams(params);
    const response = await onlineClient.get("/api/v1/debts/overdue/", {
      params: query,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    if (serverResult.data && Array.isArray(serverResult.data)) {
      serverResult.data = serverResult.data.map((item) =>
        transformKeysToCamelCase(item),
      );
    }
    return transformPaginatedResult(serverResult);
  } else {
    const result = await debtService.getOverdueDebts(params);
    return {
      status: true,
      message: "Overdue debts retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};