// src/main/ipc/debt/correct_total_amount.ipc.js
const debtService = require("../../../../services/Debt");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, newTotalAmount, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.patch(`/api/v1/debts/${id}/total`, { newTotalAmount, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Debt total amount corrected on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await debtService.correctTotalAmount(id, newTotalAmount, user, queryRunner);
    return {
      status: true,
      message: "Debt total amount corrected locally",
      data: result,
    };
  }
};