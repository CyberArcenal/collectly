// src/main/ipc/utils/sync/get/task_list.ipc.js
// (Already works with new backend - no changes needed)
//@ts-check
const onlineClient = require("../../../../../utils/onlineClient");
const { transformSingle } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { entity, status, limit = 50 } = params;

  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = new URLSearchParams();
    if (entity) query.append("entity", entity);
    if (status) query.append("status", status);
    if (limit) query.append("limit", limit);

    const response = await onlineClient.get(`/api/v1/sync/tasks/?${query.toString()}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformSingle(serverResult);
  }

  return {
    status: true,
    message: "No tasks in offline mode",
    data: { items: [], count: 0 },
  };
};