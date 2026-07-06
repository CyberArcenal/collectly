// src/main/ipc/core/penaltytransaction/get/all.ipc.js
const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/payments/penalties/
 */
function mapPenaltyParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  if (params.debtId) mapped.debt_id = params.debtId;
  if (params.borrowerId) mapped.borrower_id = params.borrowerId;
  if (params.reason) mapped.reason = params.reason;
  if (params.isAuto !== undefined) mapped.is_auto = params.isAuto;
  if (params.penaltyDateFrom) mapped.penalty_date_from = params.penaltyDateFrom;
  if (params.penaltyDateTo) mapped.penalty_date_to = params.penaltyDateTo;
  if (params.minAmount) mapped.min_amount = params.minAmount;
  if (params.maxAmount) mapped.max_amount = params.maxAmount;
  if (params.includeDeleted !== undefined) mapped.include_deleted = params.includeDeleted;
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

    const query = mapPenaltyParams(params);
    const response = await onlineClient.get('/api/v1/payments/penalties/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const options = { ...params };
    const penalties = await penaltyTransactionService.findAll(options);
    return {
      status: true,
      message: "Penalties retrieved locally",
      data: {
        data: penalties.data,
        pagination: penalties.pagination,
      },
    };
  }
};