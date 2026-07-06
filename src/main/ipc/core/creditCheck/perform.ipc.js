// src/main/ipc/creditCheck/perform.ipc.js
const creditCheckService = require("../../../../services/CreditCheck");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { debtorId, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/borrowers/credit-checks/
    // Request body: { debtor_id, score, risk_level, remarks, performed_by, external_reference }
    // Note: score and risk_level are computed by backend, so we just send debtor_id
    const response = await onlineClient.post('/api/v1/borrowers/credit-checks/', {
      debtor_id: debtorId,
      performed_by: user,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Credit check performed on server",
      data: extractData(serverResult), // { id, debtor, score, risk_level, remarks, date_checked }
    };
  } else {
    const result = await creditCheckService.performCreditCheck(debtorId, user, queryRunner);
    return {
      status: true,
      message: "Credit check performed locally",
      data: result,
    };
  }
};