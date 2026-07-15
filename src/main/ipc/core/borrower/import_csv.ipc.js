// src/main/ipc/borrower/import_csv.ipc.js
const borrowerService = require("../../../../services/Borrower");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");
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
    // Endpoint: POST /api/v1/borrowers/import/
    const response = await onlineClient.post('/api/v1/borrowers/import/', {
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
    const result = await borrowerService.importFromCSV(filePath, user, queryRunner);
    return {
      status: true,
      message: "CSV import completed locally",
      data: result,
    };
  }
};