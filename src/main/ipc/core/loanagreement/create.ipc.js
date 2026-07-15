// src/main/ipc/core/loanagreement/create.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

/**
 * Map frontend create data to backend field names
 */
function mapCreateData(data) {
  const mapped = {};
  if (data.debtId !== undefined) mapped.debt_id = data.debtId;
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
  // File upload is handled separately (multipart)
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/loan_agreements/
    // Note: File upload is not supported via JSON, but we map the fields
    const payload = mapCreateData(data);
    const response = await onlineClient.post('/api/v1/loan_agreements/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Loan agreement created on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await loanAgreementService.create(data, user, queryRunner);
    return {
      status: true,
      message: "Loan agreement created locally",
      data: result,
    };
  }
};