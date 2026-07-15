// src/main/ipc/borrower/export.ipc.js
const borrowerService = require("../../../../services/Borrower");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { format = "json", filters = {}, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: POST /api/v1/borrowers/export/
    const response = await onlineClient.post('/api/v1/borrowers/export/', { format, filters, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Export completed on server",
      data: extractData(serverResult), // { format, data, filename }
    };
  } else {
    const exportData = await borrowerService.exportBorrowers(format, filters, user);
    return {
      status: true,
      message: "Export completed locally",
      data: exportData,
    };
  }
};