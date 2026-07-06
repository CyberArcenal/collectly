// src/main/ipc/core/reminder/search.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { transformPaginatedResult } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { keyword, page, limit } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/notifications/notification-logs/search/
    const query = { keyword };
    if (page) query.page = page;
    if (limit) query.page_size = limit;

    const response = await onlineClient.get('/api/v1/notifications/notification-logs/search/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await reminderLogService.searchReminders({ keyword, page, limit });
    return {
      status: true,
      message: "Search completed locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};