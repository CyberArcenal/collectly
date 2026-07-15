// src/main/ipc/core/interestRateChangeLog/get/by_loan.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { loanId, page = 1, limit = 50 } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/debts/interest-rate-changes/ with loan_id filter
    const query = { loan_id: loanId };
    if (page) query.page = page;
    if (limit) query.page_size = limit;

    const response = await onlineClient.get('/api/v1/debts/interest-rate-changes/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await interestRateChangeLogService.getLogsForLoan(loanId, page, limit);
    return {
      status: true,
      message: "Logs for loan retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};