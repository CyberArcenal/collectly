// src/main/ipc/audit/get/stats.ipc.js
const { AuditLog } = require("../../../../../entities/AuditLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { AppDataSource } = require("../../../../db/data-source");
const { extractData } = require("../../../../../utils/responseTransformer");

/**
 * Convert start/end date to days difference (if provided)
 * Otherwise default to 7 days.
 */
function getDaysFromParams(params) {
  if (params.days) return params.days;
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }
  return 7; // default
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const days = getDaysFromParams(params);
    const response = await onlineClient.get('/api/v1/audit/stats/', { params: { days } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Audit statistics retrieved from server",
      data: extractData(serverResult), // { total, avgPerDay, mostActiveDay, uniqueUsers, dateRange }
    };
  } else {
    // Local: use start/end if provided, else last 7 days
    let startDate, endDate;
    if (params.startDate && params.endDate) {
      startDate = new Date(params.startDate);
      endDate = new Date(params.endDate);
    } else {
      const now = new Date();
      endDate = now;
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (params.days || 7));
    }
    const repo = AppDataSource.getRepository(AuditLog);
    let qb = repo.createQueryBuilder("log");
    if (startDate && endDate) {
      qb = qb.where("log.timestamp BETWEEN :start AND :end", { start: startDate, end: endDate });
    }
    const total = await qb.clone().getCount();
    const uniqueUsers = await qb.clone().select("COUNT(DISTINCT log.user)", "count").getRawOne();
    const avgPerDay = await qb.clone()
      .select("COUNT(*) / COUNT(DISTINCT DATE(log.timestamp))", "avg")
      .getRawOne();
    const mostActiveDay = await qb.clone()
      .select("DATE(log.timestamp) as day, COUNT(*) as count")
      .groupBy("DATE(log.timestamp)")
      .orderBy("count", "DESC")
      .limit(1)
      .getRawOne();
    return {
      status: true,
      message: "Audit statistics retrieved locally",
      data: {
        total,
        avgPerDay: parseFloat(avgPerDay?.avg) || 0,
        mostActiveDay: mostActiveDay ? { day: mostActiveDay.day, count: parseInt(mostActiveDay.count) } : null,
        uniqueUsers: parseInt(uniqueUsers?.count) || 0,
        dateRange: startDate && endDate ? { start: startDate.toISOString(), end: endDate.toISOString() } : null,
      },
    };
  }
};