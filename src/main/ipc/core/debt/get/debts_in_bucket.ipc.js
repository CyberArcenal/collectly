// src/main/ipc/debt/get/debts_in_bucket.ipc.js
const debtService = require("../../../../../services/Debt");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    // Endpoint: GET /api/v1/debts/bucket/
    const query = {
      asOfDate: params.asOfDate,
      bucketRange: params.bucketRange,
    };
    if (params.page) query.page = params.page;
    if (params.limit) query.page_size = params.limit;
    const response = await onlineClient.get('/api/v1/debts/bucket/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const { bucketRange, asOfDate, page = 1, limit = 10 } = params;
    const result = await debtService.getDebtsInBucket(bucketRange, asOfDate, page, limit);
    return {
      status: true,
      message: "Debts in bucket retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};