// src/main/ipc/core/loanagreement/restore.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");
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

    // Endpoint: POST /api/v1/loan_agreements/{id}/restore/
    const response = await onlineClient.post(`/api/v1/loan_agreements/${id}/restore/`, { user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Loan agreement restored on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await loanAgreementService.restore(id, user, queryRunner);
    return {
      status: true,
      message: "Loan agreement restored locally",
      data: result,
    };
  }
};