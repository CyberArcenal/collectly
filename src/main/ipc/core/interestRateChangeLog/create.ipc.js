// src/main/ipc/core/interestRateChangeLog/create.ipc.js
const interestRateChangeLogService = require("../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const {
    settingKey,
    oldValue,
    newValue,
    userId,
    loanId = null,
    reason = null,
  } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/debts/interest-rate-changes/
    // Request body: { setting_key, old_value, new_value, changed_by, reason, loan_id }
    const response = await onlineClient.post('/api/v1/debts/interest-rate-changes/', {
      setting_key: settingKey,
      old_value: oldValue,
      new_value: newValue,
      changed_by: userId,
      reason,
      loan_id: loanId,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Log created on server",
      data: extractData(serverResult),
    };
  } else {
    const log = await interestRateChangeLogService.createLog(
      settingKey,
      oldValue,
      newValue,
      userId,
      loanId,
      reason,
      queryRunner,
    );
    return {
      status: true,
      message: "Log created locally",
      data: log,
    };
  }
};