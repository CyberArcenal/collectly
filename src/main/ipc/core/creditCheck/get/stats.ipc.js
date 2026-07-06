// src/main/ipc/creditCheck/get/stats.ipc.js
const creditCheckService = require("../../../../../services/CreditCheck");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { debtorId } = params || {};
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/borrowers/credit-checks/stats/
    const query = {};
    if (debtorId) query.debtor_id = debtorId;
    const response = await onlineClient.get('/api/v1/borrowers/credit-checks/stats/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Credit check stats retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const stats = await creditCheckService.getCreditCheckStats(debtorId);
    return {
      status: true,
      message: "Credit check stats retrieved locally",
      data: stats,
    };
  }
};