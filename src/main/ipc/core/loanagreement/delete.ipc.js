// src/main/ipc/core/loanagreement/delete.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, user = "system", allowDeleteSigned = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: DELETE /api/v1/loan_agreements/{id}/?allow_delete_signed=<bool>
    const response = await onlineClient.delete(`/api/v1/loan_agreements/${id}/`, {
      params: { allow_delete_signed: allowDeleteSigned }
    });
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return {
      status: true,
      message: "Loan agreement soft deleted on server",
      data: null,
    };
  } else {
    const result = await loanAgreementService.delete(id, user, queryRunner, allowDeleteSigned);
    return {
      status: true,
      message: "Loan agreement soft deleted locally",
      data: result,
    };
  }
};