// src/main/ipc/core/paymenttransaction/bulk_update.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { updatesArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.put("/api/v1/payment-transactions/bulk-update", { updatesArray, user });
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
    const result = await paymentTransactionService.bulkUpdate(updatesArray, user, queryRunner);
    return {
      status: true,
      message: "Bulk update completed locally",
      data: result,
    };
  }
};