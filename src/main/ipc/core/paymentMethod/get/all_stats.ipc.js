// src/main/ipc/paymentMethod/get/all_stats.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/payment_methods/stats/all/
    const response = await onlineClient.get('/api/v1/payment_methods/stats/all/');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "All payment method stats retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const stats = await paymentMethodService.getAllPaymentMethodStats();
    return {
      status: true,
      message: "All payment method stats retrieved locally",
      data: stats,
    };
  }
};