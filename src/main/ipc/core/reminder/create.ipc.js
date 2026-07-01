// src/main/ipc/core/reminder/create.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params, queryRunner) => {
  const { data, user } = params; // data = { to, subject, html, text }
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post("/api/v1/reminders", { data, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Reminder log created on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await reminderLogService.createReminder(data, user, queryRunner);
    return {
      status: true,
      message: "Reminder log created locally",
      data: result,
    };
  }
};