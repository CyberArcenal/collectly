// src/main/ipc/paymentMethod/get/by_id.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { id, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get(`/api/v1/payment_methods/${id}/`, {
      params: { include_deleted: includeDeleted }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Payment method retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const result = await paymentMethodService.getPaymentMethodById(id, includeDeleted);
    return {
      status: true,
      message: "Payment method retrieved locally",
      data: result,
    };
  }
};