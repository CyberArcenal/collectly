// src/main/ipc/core/penaltytransaction/search.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { transformPaginatedResult } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { searchTerm, page, limit, debtId, borrowerId, minAmount, maxAmount } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Use the list endpoint with search param
    const query = { search: searchTerm };
    if (page) query.page = page;
    if (limit) query.page_size = limit;
    if (debtId) query.debt_id = debtId;
    if (borrowerId) query.borrower_id = borrowerId;
    if (minAmount !== undefined) query.min_amount = minAmount;
    if (maxAmount !== undefined) query.max_amount = maxAmount;

    const response = await onlineClient.get('/api/v1/payments/penalties/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const options = { search: searchTerm, page, limit, debtId, borrowerId, minAmount, maxAmount };
    const penalties = await penaltyTransactionService.findAll(options);
    return {
      status: true,
      message: "Search completed locally",
      data: {
        data: penalties.data,
        pagination: penalties.pagination,
      },
    };
  }
};