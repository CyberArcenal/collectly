// src/main/ipc/core/reminder/get/by_recipient.ipc.js
const { reminderLogService } = require("../../../../../services/ReminderLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { recipient_email, page, limit } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/notifications/notification-logs/by-recipient/
    const query = { recipient_email };
    if (page) query.page = page;
    if (limit) query.page_size = limit;

    const response = await onlineClient.get('/api/v1/notifications/notification-logs/by-recipient/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await reminderLogService.getRemindersByRecipient({ recipient_email, page, limit });
    return {
      status: true,
      message: "Notification logs by recipient retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};