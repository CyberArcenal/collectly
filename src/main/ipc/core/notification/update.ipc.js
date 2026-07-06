// src/main/ipc/core/notification/update.ipc.js
const notificationService = require("../../../../services/Notification");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapUpdateData(data) {
  const mapped = {};
  if (data.title) mapped.title = data.title;
  if (data.message) mapped.message = data.message;
  if (data.type) mapped.type = data.type;
  if (data.debtId !== undefined) mapped.debt = data.debtId; // backend uses "debt"
  if (data.scheduledFor) mapped.scheduled_for = data.scheduledFor;
  if (data.isRead !== undefined) mapped.is_read = data.isRead;
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = mapUpdateData(data);
    // Use PATCH for partial update
    const response = await onlineClient.patch(`/api/v1/notifications/${id}/`, payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Notification updated on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await notificationService.update(id, data, user, queryRunner);
    return {
      status: true,
      message: "Notification updated locally",
      data: result,
    };
  }
};