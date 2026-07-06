// src/main/ipc/core/loanagreement/update.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapUpdateData(data) {
  const mapped = {};
  if (data.debtId !== undefined) mapped.debt = data.debtId;
  if (data.status) mapped.status = data.status;
  if (data.agreementDate) mapped.agreement_date = data.agreementDate;
  if (data.lenderName !== undefined) mapped.lender_name = data.lenderName;
  if (data.termsText !== undefined) mapped.terms_text = data.termsText;
  if (data.principalAmount !== undefined) mapped.principal_amount = data.principalAmount;
  if (data.interestRate !== undefined) mapped.interest_rate = data.interestRate;
  if (data.penaltyRate !== undefined) mapped.penalty_rate = data.penaltyRate;
  if (data.dueDate) mapped.due_date = data.dueDate;
  if (data.purpose) mapped.purpose = data.purpose;
  if (data.loanStartDate) mapped.loan_start_date = data.loanStartDate;
  if (data.anniversaryDay !== undefined) mapped.anniversary_day = data.anniversaryDay;
  // signed_at, signed_by are usually not updated via PUT
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: PATCH /api/v1/loan_agreements/{id}/ (partial update)
    const payload = mapUpdateData(data);
    const response = await onlineClient.patch(`/api/v1/loan_agreements/${id}/`, payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Loan agreement updated on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await loanAgreementService.update(id, data, user, queryRunner);
    return {
      status: true,
      message: "Loan agreement updated locally",
      data: result,
    };
  }
};