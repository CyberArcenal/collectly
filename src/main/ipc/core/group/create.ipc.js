// src/main/ipc/group/create.ipc.js
const groupService = require("../../../../services/Group");
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

    // Endpoint: POST /api/v1/groups/
    // Request body: { name, description, color }
    const response = await onlineClient.post('/api/v1/groups/', data);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Group created on server",
      data: extractData(serverResult),
    };
  } else {
    const saved = await groupService.createGroup(data, user, queryRunner);
    return {
      status: true,
      message: "Group created locally",
      data: saved,
    };
  }
};