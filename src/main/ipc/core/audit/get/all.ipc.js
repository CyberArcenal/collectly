// src/main/ipc/audit/get/all.ipc.js
const { AuditLog } = require("../../../../../entities/AuditLog");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformAuditPaginated } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/audit/logs/
 */
function mapAuditLogsParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.searchTerm) mapped.q = params.searchTerm;
  if (params.entity) mapped.model_name = params.entity;
  if (params.user) mapped.user_id = params.user;
  if (params.action) mapped.action_type = params.action;
  if (params.startDate) mapped.start = params.startDate;
  if (params.endDate) mapped.end = params.endDate;
  if (params.suspicious !== undefined) mapped.suspicious = params.suspicious;
  // includeDeleted is not used in audit logs
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const query = mapAuditLogsParams(params);
    const response = await onlineClient.get('/api/v1/audit/logs/', { params: query });
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