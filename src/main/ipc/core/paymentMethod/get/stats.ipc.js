// src/main/ipc/paymentMethod/get/stats.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { methodId } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get(`/api/v1/payment_methods/${methodId}/stats/`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Payment method stats retrieved from server",
      data: extractData(serverResult), // { id, transaction_count, total_amount, average_transaction }
    };
  } else {
    const result = await paymentMethodService.getPaymentMethodStats(methodId);
    return {
      status: true,
      message: "Payment method stats retrieved locally",
      data: result,
    };
  }
};