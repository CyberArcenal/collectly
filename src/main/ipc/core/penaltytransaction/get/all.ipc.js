// src/main/ipc/core/penaltytransaction/get/all.ipc.js
const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/penalty-transactions", { params });
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