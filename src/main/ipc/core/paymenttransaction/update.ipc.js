// src/main/ipc/core/paymenttransaction/update.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapUpdateData(data) {
  const mapped = {};
  if (data.debtId !== undefined) mapped.debt = data.debtId;
  if (data.methodId !== undefined) mapped.method = data.methodId;
  if (data.amount !== undefined) mapped.amount = data.amount;
  if (data.paymentDate) mapped.payment_date = data.paymentDate;
  if (data.reference !== undefined) mapped.reference = data.reference;
  if (data.notes !== undefined) mapped.notes = data.notes;
  if (data.recordedBy !== undefined) mapped.recorded_by = data.recordedBy;
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
    const response = await onlineClient.patch(`/api/v1/payments/${id}/`, payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Payment updated on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await paymentTransactionService.update(id, data, user, queryRunner);
    return {
      status: true,
      message: "Payment updated locally",
      data: result,
    };
  }
};