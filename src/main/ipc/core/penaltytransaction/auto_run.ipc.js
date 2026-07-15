// src/main/ipc/core/penaltytransaction/auto_run.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.post('/api/v1/payments/penalties/auto-run/', { user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Auto-penalty run completed on server",
      data: extractData(serverResult), // { createdCount, totalAmount }
    };
  } else {
    const result = await penaltyTransactionService.runAutoPenalty(user, queryRunner);
    return {
      status: true,
      message: "Auto-penalty run completed locally",
      data: result,
    };
  }
};