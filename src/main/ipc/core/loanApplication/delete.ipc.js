// src/main/ipc/core/loanApplication/delete.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.delete(`/api/v1/loan_applications/${id}/`);
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return {
      status: true,
      message: "Loan application soft deleted on server",
      data: null,
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