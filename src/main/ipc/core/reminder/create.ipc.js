// src/main/ipc/core/reminder/create.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

/**
 * Map frontend create data to backend format
 */
function mapCreateData(data) {
  const mapped = {};
  if (data.to) mapped.recipient_email = data.to;
  if (data.subject !== undefined) mapped.subject = data.subject;
  if (data.html || data.text) mapped.payload = data.html || data.text;
  if (data.status) mapped.status = data.status;
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
    const response = await onlineClient.post('/api/v1/notifications/notification-logs/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Notification log created on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await reminderLogService.createReminder(data, user, queryRunner);
    return {
      status: true,
      message: "Notification log created locally",
      data: result,
    };
  }
};