// src/main/ipc/group/get/by_id.ipc.js
const groupService = require("../../../../../services/Group");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { id } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/groups/{id}/
    const response = await onlineClient.get(`/api/v1/groups/${id}/`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return {
      status: true,
      message: "Group retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const group = await groupService.getGroupById(id);
    return {
      status: true,
      message: "Group retrieved locally",
      data: group,
    };
  }
};