// src/main/ipc/debt/import_csv.ipc.js
const debtService = require("../../../../services/Debt");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const fs = require("fs").promises;
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { filePath, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const fileContent = await fs.readFile(filePath, 'utf-8');
    // Endpoint: POST /api/v1/debts/import/
    const response = await onlineClient.post('/api/v1/debts/import/', {
      fileContent,
      fileName: filePath.split(/[/\\]/).pop(),
      user,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "CSV import completed on server",
      data: extractData(serverResult), // { imported, errors }
    };
  } else {
    const result = await debtService.importFromCSV(filePath, user, queryRunner);
    return {
      status: true,
      message: "CSV import completed locally",
      data: result,
    };
  }
};