// src/main/ipc/core/loanagreement/bulk_create.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapBulkCreateData(agreementsArray) {
  return agreementsArray.map(item => ({
    debt_id: item.debtId,
    status: item.status || 'draft',
    agreement_date: item.agreementDate,
    lender_name: item.lenderName,
    terms_text: item.termsText,
    principal_amount: item.principalAmount,
    interest_rate: item.interestRate,
    penalty_rate: item.penaltyRate,
    due_date: item.dueDate,
    purpose: item.purpose,
    loan_start_date: item.loanStartDate,
    anniversary_day: item.anniversaryDay,
  }));
}

module.exports = async (params, queryRunner) => {
  const { agreementsArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/loan_agreements/bulkCreate/
    const payload = mapBulkCreateData(agreementsArray);
    const response = await onlineClient.post('/api/v1/loan_agreements/bulkCreate/', { agreements: payload, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Bulk create completed on server",
      data: extractData(serverResult), // { created, errors }
    };
  } else {
    const result = await loanAgreementService.bulkCreate(agreementsArray, user, queryRunner);
    return {
      status: true,
      message: "Bulk create completed locally",
      data: result,
    };
  }
};