// src/main/ipc/core/paymenttransaction/delete.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.delete(`/api/v1/payment-transactions/${id}`, { data: { user } });
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    if (response.status === 204) {
      return {
        status: true,
        message: "Payment soft deleted on server",
        data: null,
      };
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Payment soft deleted on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await paymentTransactionService.delete(id, user, queryRunner);
    return {
      status: true,
      message: "Payment soft deleted locally",
      data: result,
    };
  }
};