// src/main/ipc/core/paymentMethod/get/all_stats.ipc.js
//@ts-check
const paymentMethodService = require("../../../../../services/PaymentMethod");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");
const { transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get("/api/v1/payment-methods/stats/all/");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const stats = transformKeysToCamelCase(serverResult);
    console.log("Retrieved statistics from server:", stats);
    return {
      status: true,
      message: stats.message || "Statistics retrieved from server",
      data: stats.data,
    };
  } else {
    // Offline
    const stats = await paymentMethodService.getAllStats(params);
    return {
      status: true,
      message: "Payment method statistics retrieved locally",
      data: stats,
    };
  }
};