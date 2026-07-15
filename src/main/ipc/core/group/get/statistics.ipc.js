// src/main/ipc/core/group/get/statistics.ipc.js
//@ts-check
const groupService = require("../../../../../services/Group");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");
const { transformKeysToCamelCase } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // No required query parameters for overall stats
    const response = await onlineClient.get("/api/v1/groups/stats/overall/");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    // Transform snake_case to camelCase
    const stats = transformKeysToCamelCase(serverResult);
    // Also transform the nested groups array
    if (stats.data.groups) {
      stats.data.groups = stats.data.groups.map(g => transformKeysToCamelCase(g));
    }

    return {
      status: true,
      message: stats.message || "Group statistics retrieved from server",
      data: stats.data,
    };
  } else {
    // Offline
    const stats = await groupService.getStatistics(params);
    return {
      status: true,
      message: "Group statistics retrieved locally",
      data: stats,
    };
  }
};