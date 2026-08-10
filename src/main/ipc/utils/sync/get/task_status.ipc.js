// src/main/ipc/utils/sync/get/task_status.ipc.js
// (This file already works with the new backend - no changes needed)
//@ts-check
const onlineClient = require("../../../../../utils/onlineClient");
const { transformSingle } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { taskId } = params;

  if (!taskId) {
    return {
      status: false,
      message: "taskId is required",
      data: null,
    };
  }

  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get(`/api/v1/sync/task/${taskId}/`);
    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: false,
          message: "Task not found",
          data: null,
        };
      }
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformSingle(serverResult);
  }

  return {
    status: false,
    message: "Task status only available in online mode",
    data: null,
  };
};