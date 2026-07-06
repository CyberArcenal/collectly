// src/main/ipc/core/penaltytransaction/bulk_update.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapBulkUpdateData(updatesArray) {
  return updatesArray.map(item => ({
    id: item.id,
    ...(item.updates.debtId !== undefined && { debt: item.updates.debtId }),
    ...(item.updates.amount !== undefined && { amount: item.updates.amount }),
    ...(item.updates.penaltyDate && { penalty_date: item.updates.penaltyDate }),
    ...(item.updates.reason !== undefined && { reason: item.updates.reason }),
    ...(item.updates.isAuto !== undefined && { is_auto: item.updates.isAuto }),
  }));
}

module.exports = async (params, queryRunner) => {
  const { updatesArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = { updates: mapBulkUpdateData(updatesArray), user };
    const response = await onlineClient.put('/api/v1/payments/penalties/bulkUpdate/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Bulk update completed on server",
      data: extractData(serverResult), // { updated, errors }
    };
  } else {
    const result = await penaltyTransactionService.bulkUpdate(updatesArray, user, queryRunner);
    return {
      status: true,
      message: "Bulk update completed locally",
      data: result,
    };
  }
};