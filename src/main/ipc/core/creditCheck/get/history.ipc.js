// src/main/ipc/creditCheck/get/history.ipc.js
const creditCheckService = require("../../../../../services/CreditCheck");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { debtorId, page = 1, limit = 20 } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/borrowers/credit-checks/
    // Parameters: debtor_id, page, page_size, risk_level, from_date, to_date
    const query = { debtor_id: debtorId };
    if (page) query.page = page;
    if (limit) query.page_size = limit;
    const response = await onlineClient.get('/api/v1/borrowers/credit-checks/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await creditCheckService.getCreditCheckHistory(debtorId, page, limit);
    return {
      status: true,
      message: "Credit check history retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};