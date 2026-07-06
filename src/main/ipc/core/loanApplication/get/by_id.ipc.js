// src/main/ipc/core/loanApplication/get/by_id.ipc.js
const loanApplicationService = require("../../../../../services/LoanApplication");
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

    const response = await onlineClient.get(`/api/v1/loan_applications/${id}/`, {
      params: { include_deleted: includeDeleted }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Loan application retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const result = await loanApplicationService.getApplicationById(id, includeDeleted);
    return {
      status: true,
      message: "Loan application retrieved locally",
      data: result,
    };
  }
};