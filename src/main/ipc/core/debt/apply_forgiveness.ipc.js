// src/main/ipc/debt/apply_forgiveness.ipc.js
const debtService = require("../../../../services/Debt");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, amountForgiven, user = "system", reason = null } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    // Endpoint: POST /api/v1/debts/{id}/forgive/
    const response = await onlineClient.post(`/api/v1/debts/${id}/forgive/`, { amountForgiven, reason });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Debt forgiveness applied on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await debtService.applyForgiveness(id, amountForgiven, user, reason, queryRunner);
    return {
      status: true,
      message: "Debt forgiveness applied locally",
      data: result,
    };
  }
};