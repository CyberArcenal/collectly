// src/main/ipc/core/audit/get/recent.ipc.js
//@ts-check
const { AuditLog } = require("../../../../../entities/AuditLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { AppDataSource } = require("../../../../db/data-source");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const query = {};
    if (params.limit) query.limit = params.limit;
    const response = await onlineClient.get('/api/v1/audit/recent/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    // Server may return { data: [...] } or { data: { items: [...] } }
    // We normalize to { items: [...], limit }
    const data = extractData(serverResult);
    let items = data;
    let limit = params.limit || 10;
    if (data && typeof data === 'object' && !Array.isArray(data) && data.items) {
      items = data.items;
      limit = data.limit || limit;
    }
    return {
      status: true,
      message: "Recent activities retrieved from server",
      data: { items, limit },
    };
  } else {
    const { limit = 10 } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    const items = await repo.find({
      order: { timestamp: "DESC" },
      take: Math.min(limit, 50),
    });
    return { status: true, message: "Recent activities retrieved locally", data: { items, limit } };
  }
};