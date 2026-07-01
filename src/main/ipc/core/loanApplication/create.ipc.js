// src/main/ipc/core/loanApplication/create.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post("/api/v1/loan-applications", data);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Loan application created on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await loanApplicationService.createApplication(
      data,
      user,
      queryRunner,
    );
    return {
      status: true,
      message: "Loan application created locally",
      data: result,
    };
  }
};