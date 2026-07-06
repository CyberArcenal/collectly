// src/main/ipc/core/penaltytransaction/get/total_by_debt.ipc.js
const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { debtId, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get('/api/v1/payments/penalties/total-by-debt/', {
      params: { debt_id: debtId, include_deleted: includeDeleted }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Total penalty retrieved from server",
      data: extractData(serverResult), // { debtId, totalPenalty, penaltyCount }
    };
  } else {
    const result = await penaltyTransactionService.getTotalPenaltyForDebt(debtId, includeDeleted);
    return {
      status: true,
      message: "Total penalty retrieved locally",
      data: result,
    };
  }
};