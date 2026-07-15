// src/main/ipc/debt/search.ipc.js
const debtService = require("../../../../services/Debt");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { transformPaginatedResult } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    // Search uses the same endpoint as getAll with search parameter
    const query = { search: params.searchTerm };
    if (params.page) query.page = params.page;
    if (params.limit) query.page_size = params.limit;
    if (params.status) query.status = params.status;
    if (params.borrowerId) query.borrower_id = params.borrowerId;
    const response = await onlineClient.get('/api/v1/debts/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const { searchTerm, page, limit, status, borrowerId } = params;
    const options = { search: searchTerm, page, limit, status, borrowerId };
    const debts = await debtService.findAll(options);
    return {
      status: true,
      message: "Search completed locally",
      data: {
        data: debts.data,
        pagination: debts.pagination,
      },
    };
  }
};