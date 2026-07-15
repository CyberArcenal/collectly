// src/main/ipc/core/loanApplication/update.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapUpdateData(data) {
  const mapped = {};
  if (data.debtorId !== undefined) mapped.debtor = data.debtorId;
  if (data.debtorName) mapped.debtor_name = data.debtorName;
  if (data.debtorContact !== undefined) mapped.debtor_contact = data.debtorContact;
  if (data.debtorEmail !== undefined) mapped.debtor_email = data.debtorEmail;
  if (data.debtorAddress !== undefined) mapped.debtor_address = data.debtorAddress;
  if (data.requestedAmount !== undefined) mapped.requested_amount = data.requestedAmount;
  if (data.purpose) mapped.purpose = data.purpose;
  if (data.proposedDueDate) mapped.proposed_due_date = data.proposedDueDate;
  if (data.interestRate !== undefined) mapped.interest_rate = data.interestRate;
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = mapUpdateData(data); // ✅ Only map for online
    const response = await onlineClient.patch(`/api/v1/loan_applications/${id}/`, payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Loan application updated on server",
      data: extractData(serverResult),
    };
  } else {
    // ✅ Offline stays as‑is (camelCase)
    const result = await loanApplicationService.updateApplication(id, data, user, queryRunner);
    return {
      status: true,
      message: "Loan application updated locally",
      data: result,
    };
  }
};