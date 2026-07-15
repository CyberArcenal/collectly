// src/main/ipc/core/penaltytransaction/bulk_create.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapBulkCreateData(penaltiesArray) {
  return penaltiesArray.map(item => ({
    debt_id: item.debtId,
    amount: item.amount,
    penalty_date: item.penaltyDate,
    reason: item.reason,
    is_auto: item.isAuto || false,
  }));
}

module.exports = async (params, queryRunner) => {
  const { penaltiesArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = { penalties: mapBulkCreateData(penaltiesArray), user };
    const response = await onlineClient.post('/api/v1/payments/penalties/bulkCreate/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Bulk create completed on server",
      data: extractData(serverResult), // { created, errors }
    };
  } else {
    const result = await penaltyTransactionService.bulkCreate(penaltiesArray, user, queryRunner);
    return {
      status: true,
      message: "Bulk create completed locally",
      data: result,
    };
  }
};