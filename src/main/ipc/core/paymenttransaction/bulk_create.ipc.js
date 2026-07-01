// src/main/ipc/core/paymenttransaction/bulk_create.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { paymentsArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post("/api/v1/payment-transactions/bulk-create", { paymentsArray, user });
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
    const result = await paymentTransactionService.bulkCreate(paymentsArray, user, queryRunner);
    return {
      status: true,
      message: "Bulk create completed locally",
      data: result,
    };
  }
};