// src/main/ipc/paymentMethod/update.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.put(`/api/v1/payment-methods/${id}`, data);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Payment method updated on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await paymentMethodService.updatePaymentMethod(id, data, user, queryRunner);
    return {
      status: true,
      message: "Payment method updated locally",
      data: result,
    };
  }
};