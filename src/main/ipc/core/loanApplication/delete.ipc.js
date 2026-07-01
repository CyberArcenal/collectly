// src/main/ipc/core/loanApplication/delete.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");
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
    const response = await onlineClient.delete(`/api/v1/loan-applications/${id}`, { data: { user } });
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    if (response.status === 204) {
      return {
        status: true,
        message: "Loan application soft deleted on server",
        data: null,
      };
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Loan application soft deleted on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await loanApplicationService.deleteApplication(id, user, queryRunner);
    return {
      status: true,
      message: "Loan application soft deleted locally",
      data: result,
    };
  }
};