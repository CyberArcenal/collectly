// src/main/ipc/core/notification/bulk_update.ipc.js
const notificationService = require("../../../../services/Notification");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapBulkUpdateData(updatesArray) {
  return updatesArray.map(item => ({
    id: item.id,
    ...(item.updates.title && { title: item.updates.title }),
    ...(item.updates.message && { message: item.updates.message }),
    ...(item.updates.type && { type: item.updates.type }),
    ...(item.updates.debtId !== undefined && { debt: item.updates.debtId }),
    ...(item.updates.scheduledFor && { scheduled_for: item.updates.scheduledFor }),
    ...(item.updates.isRead !== undefined && { is_read: item.updates.isRead }),
  }));
}

module.exports = async (params, queryRunner) => {
  const { updatesArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = { updates: mapBulkUpdateData(updatesArray), user };
    const response = await onlineClient.put('/api/v1/notifications/bulkUpdate/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Bulk update completed on server",
      data: extractData(serverResult), // { updated, errors }
    };
  } else {
    const result = await notificationService.bulkUpdate(updatesArray, user, queryRunner);
    return {
      status: true,
      message: "Bulk update completed locally",
      data: result,
    };
  }
};