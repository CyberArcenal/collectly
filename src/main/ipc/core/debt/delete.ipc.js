// src/main/ipc/debt/delete.ipc.js
const debtService = require("../../../../services/Debt");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.delete(`/api/v1/debts/${id}`);
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    // Handle 204 No Content
    if (response.status === 204) {
      return {
        status: true,
        message: "Debt soft deleted on server",
        data: null,
      };
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Debt soft deleted on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await debtService.delete(id, user, queryRunner);
    return {
      status: true,
      message: "Debt soft deleted locally",
      data: result,
    };
  }
};