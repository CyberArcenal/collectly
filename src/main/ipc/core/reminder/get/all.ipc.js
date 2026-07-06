// src/main/ipc/core/reminder/get/all.ipc.js
//@ts-check
const { reminderLogService } = require("../../../../../services/ReminderLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");
const { logger } = require("../../../../../utils/logger");

/**
 * Map frontend params to backend query params for /api/v1/notifications/notification-logs/
 */
function mapNotificationLogParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.status) mapped.status = params.status;
  if (params.recipient_email) mapped.recipient_email = params.recipient_email;
  if (params.startDate) mapped.from_date = params.startDate;
  if (params.endDate) mapped.to_date = params.endDate;
  if (params.search) mapped.search = params.search;
  if (params.sortBy) mapped.sort_by = params.sortBy;
  if (params.sortOrder) mapped.sort_order = params.sortOrder;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapNotificationLogParams(params);
    const response = await onlineClient.get('/api/v1/notifications/notification-logs/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    logger.debug(`Server response for notification logs: ${JSON.stringify(serverResult)}`);
    return transformPaginatedResult(serverResult);
  } else {
    const result = await reminderLogService.getAllReminders(params);
    return {
      status: true,
      message: "Notification logs retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};