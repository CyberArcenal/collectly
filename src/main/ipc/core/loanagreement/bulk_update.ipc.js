// src/main/ipc/core/loanagreement/bulk_update.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapBulkUpdateData(updatesArray) {
  return updatesArray.map(item => ({
    id: item.id,
    ...(item.updates.debtId !== undefined && { debt: item.updates.debtId }),
    ...(item.updates.status && { status: item.updates.status }),
    ...(item.updates.agreementDate && { agreement_date: item.updates.agreementDate }),
    ...(item.updates.lenderName !== undefined && { lender_name: item.updates.lenderName }),
    ...(item.updates.termsText !== undefined && { terms_text: item.updates.termsText }),
    ...(item.updates.principalAmount !== undefined && { principal_amount: item.updates.principalAmount }),
    ...(item.updates.interestRate !== undefined && { interest_rate: item.updates.interestRate }),
    ...(item.updates.penaltyRate !== undefined && { penalty_rate: item.updates.penaltyRate }),
    ...(item.updates.dueDate && { due_date: item.updates.dueDate }),
    ...(item.updates.purpose && { purpose: item.updates.purpose }),
    ...(item.updates.loanStartDate && { loan_start_date: item.updates.loanStartDate }),
    ...(item.updates.anniversaryDay !== undefined && { anniversary_day: item.updates.anniversaryDay }),
  }));
}

module.exports = async (params, queryRunner) => {
  const { updatesArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: PUT /api/v1/loan_agreements/bulkUpdate/
    const payload = mapBulkUpdateData(updatesArray);
    const response = await onlineClient.put('/api/v1/loan_agreements/bulkUpdate/', { updates: payload, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Bulk update completed on server",
      data: extractData(serverResult), // { updated, errors }
    };
  } else {
    const result = await loanAgreementService.bulkUpdate(updatesArray, user, queryRunner);
    return {
      status: true,
      message: "Bulk update completed locally",
      data: result,
    };
  }
};