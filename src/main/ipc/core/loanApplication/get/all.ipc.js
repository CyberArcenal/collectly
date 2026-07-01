// src/main/ipc/core/loanApplication/get/all.ipc.js
const loanApplicationService = require("../../../../../services/LoanApplication");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/loan-applications", { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await loanApplicationService.getAllApplications(params);
    return {
      status: true,
      message: "Loan applications retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};