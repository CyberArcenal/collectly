// src/main/ipc/core/notification/create.ipc.js
const notificationService = require("../../../../services/Notification");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

/**
 * Map frontend create data to backend format
 */
function mapCreateData(data) {
  const mapped = {};
  if (data.title) mapped.title = data.title;
  if (data.message) mapped.message = data.message;
  if (data.type) mapped.type = data.type;
  if (data.debtId !== undefined) mapped.debt_id = data.debtId;
  if (data.scheduledFor) mapped.scheduled_for = data.scheduledFor;
  if (data.isRead !== undefined) mapped.is_read = data.isRead;
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = mapCreateData(data);
    const response = await onlineClient.post('/api/v1/notifications/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Notification created on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await notificationService.create(data, user, queryRunner);
    return {
      status: true,
      message: "Notification created locally",
      data: result,
    };
  }
};