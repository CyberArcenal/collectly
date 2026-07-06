// src/main/ipc/core/loanagreement/get/by_id.ipc.js
const loanAgreementService = require("../../../../../services/LoanAgreement");
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

    // Endpoint: GET /api/v1/loan_agreements/{id}/?include_deleted=<bool>
    const response = await onlineClient.get(`/api/v1/loan_agreements/${id}/`, {
      params: { include_deleted: includeDeleted }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Loan agreement retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const agreement = await loanAgreementService.findById(id, includeDeleted);
    return {
      status: true,
      message: "Loan agreement retrieved locally",
      data: agreement,
    };
  }
};