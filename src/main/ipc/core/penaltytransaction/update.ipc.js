// src/main/ipc/core/penaltytransaction/update.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapUpdateData(data) {
  const mapped = {};
  if (data.debtId !== undefined) mapped.debt = data.debtId;
  if (data.amount !== undefined) mapped.amount = data.amount;
  if (data.penaltyDate) mapped.penalty_date = data.penaltyDate;
  if (data.reason !== undefined) mapped.reason = data.reason;
  if (data.isAuto !== undefined) mapped.is_auto = data.isAuto;
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = mapUpdateData(data);
    const response = await onlineClient.patch(`/api/v1/payments/penalties/${id}/`, payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Penalty updated on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await penaltyTransactionService.update(id, data, user, queryRunner);
    return {
      status: true,
      message: "Penalty updated locally",
      data: result,
    };
  }
};