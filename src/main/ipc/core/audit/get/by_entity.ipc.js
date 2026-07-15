// src/main/ipc/audit/get/by_entity.ipc.js
const { AuditLog } = require("../../../../../entities/AuditLog");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const query = { entity: params.entity };
    if (params.entityId !== undefined) query.entityId = params.entityId;
    if (params.page) query.page = params.page;
    if (params.limit) query.page_size = params.limit;
    const response = await onlineClient.get('/api/v1/audit/entity/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const { entity, entityId, page = 1, limit = 50 } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    const qb = repo.createQueryBuilder("log")
      .where("log.entity = :entity", { entity })
      .orderBy("log.timestamp", "DESC");
    if (entityId !== undefined) {
      qb.andWhere("log.entityId = :entityId", { entityId });
    }
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      status: true,
      message: "Audit logs by entity retrieved locally",
      data: { data: items, total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
};