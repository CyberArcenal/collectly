// src/main/ipc/utils/sync/poll_task.ipc.js
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { taskId, interval = 1000, timeout = 300000, onProgress } = params;

  if (!taskId) {
    return {
      status: false,
      message: "taskId is required",
      data: null,
    };
  }

  const mode = await syncMode();
  if (mode !== "online") {
    return {
      status: false,
      message: "Polling only available in online mode",
      data: null,
    };
  }

  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const startTime = Date.now();
  let lastProgress = null;

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      return {
        status: false,
        message: "Polling timed out",
        data: lastProgress,
      };
    }

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
    const data = transformKeysToCamelCase(serverResult);
    lastProgress = data;

    // Check if complete
    if (data.status === "completed") {
      return {
        status: true,
        message: "Task completed",
        data: data,
      };
    }

    if (data.status === "failed") {
      return {
        status: false,
        message: data.error || "Task failed",
        data: data,
      };
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};