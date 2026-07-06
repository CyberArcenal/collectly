// src/main/ipc/debt/get/all.ipc.js
//@ts-check
const debtService = require("../../../../../services/Debt");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");
const {
  transformPaginatedResult,
  transformKeysToCamelCase,
} = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/debts/
 */
function mapDebtParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  if (params.status) mapped.status = params.status;
  if (params.borrowerId) mapped.borrower_id = params.borrowerId;
  if (params.dueDateFrom) mapped.due_date_from = params.dueDateFrom;
  if (params.dueDateTo) mapped.due_date_to = params.dueDateTo;
  if (params.minTotalAmount !== undefined)
    mapped.min_total_amount = params.minTotalAmount;
  if (params.maxTotalAmount !== undefined)
    mapped.max_total_amount = params.maxTotalAmount;
  if (params.includeDeleted !== undefined)
    mapped.include_deleted = params.includeDeleted;
  if (params.sortBy) mapped.sort_by = params.sortBy;
  if (params.sortOrder) mapped.sort_order = params.sortOrder;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapDebtParams(params);
    const response = await onlineClient.get("/api/v1/debts/", {
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
    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      includeDeleted,
      status,
      borrowerId,
      dueDateFrom,
      dueDateTo,
      minTotalAmount,
      maxTotalAmount,
    } = params;
    const options = {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      includeDeleted,
      status,
      borrowerId,
      dueDateFrom,
      dueDateTo,
      minTotalAmount,
      maxTotalAmount,
    };
    const debts = await debtService.findAll(options);
    return {
      status: true,
      message: "Debts retrieved locally",
      data: {
        data: debts.data,
        pagination: debts.pagination,
      },
    };
  }
};
