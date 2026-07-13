// src/main/ipc/core/audit/get_top_activities.ipc.js
//@ts-check
const { AuditLog } = require("../../../../entities/AuditLog");
const { AppDataSource } = require("../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");
const { transformPaginatedResult, extractData } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const query = {};
    if (params.limit) query.limit = params.limit;
    if (params.startDate) query.startDate = params.startDate;
    if (params.endDate) query.endDate = params.endDate;
    const response = await onlineClient.get('/api/v1/audit/top-activities/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Top activities retrieved from server",
      data: extractData(serverResult),
    };
  } else {
    const { limit = 10, startDate, endDate } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    let qb = repo.createQueryBuilder("log");
    if (startDate && endDate) {
      qb = qb.where("log.timestamp BETWEEN :start AND :end", { start: new Date(startDate), end: new Date(endDate) });
    }
    const topActions = await qb.clone()
      .select("log.action", "action")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.action")
      .orderBy("count", "DESC")
      .limit(limit)
      .getRawMany();
    const topEntities = await qb.clone()
      .select("log.entity", "entity")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.entity")
      .orderBy("count", "DESC")
      .limit(limit)
      .getRawMany();
    const topUsers = await qb.clone()
      .select("log.user", "user")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.user")
      .orderBy("count", "DESC")
      .limit(limit)
      .getRawMany();
    return { status: true, message: "Top activities retrieved locally", data: { topActions, topEntities, topUsers } };
  }
};