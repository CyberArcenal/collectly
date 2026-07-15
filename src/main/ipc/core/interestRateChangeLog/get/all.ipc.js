// src/main/ipc/core/interestRateChangeLog/get/all.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/debts/interest-rate-changes/
 */
function mapInterestRateLogParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.settingKey) mapped.setting_key = params.settingKey;
  if (params.loanId) mapped.loan_id = params.loanId;
  if (params.changedBy) mapped.changed_by = params.changedBy;
  if (params.fromDate) mapped.from_date = params.fromDate;
  if (params.toDate) mapped.to_date = params.toDate;
  return mapped;
}

module.exports = async (params) => {
  const { filters, page = 1, limit = 50 } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Combine filters with pagination
    const query = { ...mapInterestRateLogParams(filters || {}) };
    if (page) query.page = page;
    if (limit) query.page_size = limit;

    // Endpoint: GET /api/v1/debts/interest-rate-changes/
    const response = await onlineClient.get('/api/v1/debts/interest-rate-changes/', { params: query });
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