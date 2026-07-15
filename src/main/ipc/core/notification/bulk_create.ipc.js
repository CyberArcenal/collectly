// src/main/ipc/core/notification/bulk_create.ipc.js
const notificationService = require("../../../../services/Notification");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapBulkCreateData(notificationsArray) {
  return notificationsArray.map(item => ({
    title: item.title,
    message: item.message,
    type: item.type || 'reminder',
    debt_id: item.debtId,
    scheduled_for: item.scheduledFor,
    is_read: item.isRead || false,
  }));
}

module.exports = async (params, queryRunner) => {
  const { notificationsArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = { notifications: mapBulkCreateData(notificationsArray), user };
    const response = await onlineClient.post('/api/v1/notifications/bulkCreate/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Bulk create completed on server",
      data: extractData(serverResult), // { created, errors }
    };
  } else {
    const result = await notificationService.bulkCreate(notificationsArray, user, queryRunner);
    return {
      status: true,
      message: "Bulk create completed locally",
      data: result,
    };
  }
};