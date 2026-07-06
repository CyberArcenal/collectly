// src/main/ipc/core/notification/get/all.ipc.js
const notificationService = require("../../../../../services/Notification");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/notifications/
 */
function mapNotificationParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  if (params.debtId) mapped.debt_id = params.debtId;
  if (params.type) mapped.type = params.type;
  if (params.isRead !== undefined) mapped.is_read = params.isRead;
  if (params.includeDeleted !== undefined) mapped.include_deleted = params.includeDeleted;
  if (params.fromDate) mapped.from_date = params.fromDate;
  if (params.toDate) mapped.to_date = params.toDate;
  // scheduledForFrom/To are not in spec; we can map to from_date/to_date if needed
  if (params.scheduledForFrom) mapped.from_date = params.scheduledForFrom;
  if (params.scheduledForTo) mapped.to_date = params.scheduledForTo;
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

    const query = mapNotificationParams(params);
    const response = await onlineClient.get('/api/v1/notifications/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const options = { ...params };
    const notifications = await notificationService.findAll(options);
    return {
      status: true,
      message: "Notifications retrieved locally",
      data: {
        data: notifications.data,
        pagination: notifications.pagination,
      },
    };
  }
};