// src/main/ipc/audit/get/all.ipc.js
const { AuditLog } = require("../../../../../entities/AuditLog");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformAuditPaginated } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/audit/logs', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformAuditPaginated(serverResult);
  } else {
    const { page = 1, limit = 50 } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    const [items, total] = await repo.findAndCount({
      order: { timestamp: "DESC" },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return {
      status: true,
      message: "Audit logs retrieved locally",
      data: { items, total, page, limit: Number(limit), totalPages: Math.ceil(total / limit) },
    };
  }
};