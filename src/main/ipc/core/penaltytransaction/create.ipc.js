// src/main/ipc/core/penaltytransaction/create.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

/**
 * Map frontend create data to backend format for /api/v1/payments/penalties/
 */
function mapCreateData(data) {
  const mapped = {};
  if (data.debtId !== undefined) mapped.debt_id = data.debtId;
  if (data.amount !== undefined) mapped.amount = data.amount;
  if (data.penaltyDate) mapped.penalty_date = data.penaltyDate;
  if (data.reason !== undefined) mapped.reason = data.reason;
  if (data.isAuto !== undefined) mapped.is_auto = data.isAuto;
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = mapCreateData(data);
    const response = await onlineClient.post('/api/v1/payments/penalties/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Penalty created on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await penaltyTransactionService.create(data, user, queryRunner);
    return {
      status: true,
      message: "Penalty created locally",
      data: result,
    };
  }
};