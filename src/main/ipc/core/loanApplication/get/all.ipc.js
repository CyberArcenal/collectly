// src/main/ipc/core/loanApplication/get/all.ipc.js
const loanApplicationService = require("../../../../../services/LoanApplication");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/loan_applications/
 */
function mapApplicationParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  if (params.status) mapped.status = params.status;
  if (params.debtorId) mapped.debtor_id = params.debtorId;
  if (params.fromDate) mapped.from_date = params.fromDate;
  if (params.toDate) mapped.to_date = params.toDate;
  if (params.sortBy) mapped.sort_by = params.sortBy;
  if (params.sortOrder) mapped.sort_order = params.sortOrder;
  if (params.includeDeleted !== undefined) mapped.include_deleted = params.includeDeleted;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapApplicationParams(params);
    const response = await onlineClient.get('/api/v1/loan_applications/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await loanApplicationService.getAllApplications(params);
    return {
      status: true,
      message: "Loan applications retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};