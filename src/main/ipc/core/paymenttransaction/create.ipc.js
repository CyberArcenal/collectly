// src/main/ipc/core/paymenttransaction/create.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

/**
 * Map frontend create data to backend format for /api/v1/payments/
 */
function mapCreateData(data) {
  const mapped = {};
  if (data.debtId !== undefined) mapped.debt_id = data.debtId;
  if (data.methodId !== undefined) mapped.method_id = data.methodId;
  if (data.amount !== undefined) mapped.amount = data.amount;
  if (data.paymentDate) mapped.payment_date = data.paymentDate;
  if (data.reference !== undefined) mapped.reference = data.reference;
  if (data.notes !== undefined) mapped.notes = data.notes;
  if (data.recordedBy !== undefined) mapped.recorded_by = data.recordedBy;
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
    const response = await onlineClient.post('/api/v1/payments/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Payment created on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await paymentTransactionService.create(data, user, queryRunner);
    return {
      status: true,
      message: "Payment created locally",
      data: result,
    };
  }
};