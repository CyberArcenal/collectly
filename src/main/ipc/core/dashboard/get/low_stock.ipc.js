// src/main/ipc/dashboard/get/low_stock.ipc.js
const Debt = require("../../../../../entities/Debt");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");
const { extractData } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/analytics/dashboard/low-stock/
 */
function mapLowStockParams(params) {
  const mapped = {};
  if (params.threshold) mapped.threshold = params.threshold;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapLowStockParams(params);
    const response = await onlineClient.get('/api/v1/analytics/dashboard/low-stock/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return {
      status: true,
      message: "Low stock retrieved from server",
      data: extractData(result),
    };
  } else {
    const repo = AppDataSource.getRepository(Debt);
    const { threshold = 5 } = params;
    const dueSoon = await repo
      .createQueryBuilder("debt")
      .where("debt.dueDate BETWEEN :today AND :nextWeek", {
        today: new Date(),
        nextWeek: new Date(Date.now() + threshold * 24 * 60 * 60 * 1000)
      })
      .andWhere("debt.status != 'paid'")
      .andWhere("debt.deletedAt IS NULL")
      .limit(10)
      .getMany();

    return {
      status: true,
      message: "Low stock / due soon retrieved locally",
      data: dueSoon.map(d => ({ id: d.id, name: d.name, dueDate: d.dueDate })),
    };
  }
};