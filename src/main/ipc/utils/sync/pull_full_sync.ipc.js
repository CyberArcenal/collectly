// src/main/ipc/utils/sync/pull_full_sync.ipc.js
//@ts-check
const syncSnapshotService = require("../../../../services/SyncSnapshotService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { AppDataSource } = require("../../../db/data-source");
const { ENTITIES } = require("./sync.config");
const {logger} = require("../../../../utils/logger");

/**
 * Replace all records for an entity with the new ones.
 * Uses a transaction to avoid partial updates.
 */
async function replaceEntityRecords(entityName, newRecords) {
  const repo = AppDataSource.getRepository(entityName);
  
  // Delete all existing records
  await repo.clear();
  
  // Insert new records (convert snake_case back to camelCase)
  const camelCaseRecords = newRecords.map(record => {
    const camel = {};
    for (const [key, value] of Object.entries(record)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camel[camelKey] = value;
    }
    return camel;
  });
  
  if (camelCaseRecords.length > 0) {
    await repo.insert(camelCaseRecords);
  }
  
  // Update snapshot
  await syncSnapshotService.updateSnapshot(
    entityName,
    camelCaseRecords.length,
    null,
    null // no taskId for pull
  );
  
  logger.info(`[PullSync] Replaced ${entityName} with ${camelCaseRecords.length} records`);
}

module.exports = async (params) => {
  const { user = "system" } = params;
  const mode = await syncMode();
  
  if (mode !== "online") {
    return {
      status: false,
      message: "Pull sync requires online mode",
      data: null,
    };
  }
  
  const url = await serverUrl();
  if (!url) {
    return {
      status: false,
      message: "Server URL not configured",
      data: null,
    };
  }
  onlineClient.setBaseUrl(url);
  
  try {
    logger.info("[PullSync] Starting pull full sync...");
    
    // ─── 1. Fetch data from server ───
    const response = await onlineClient.get("/api/v1/sync/download/");
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[PullSync] Server error: ${response.status} - ${errorText}`);
      return {
        status: false,
        message: `Server error: ${response.status} - ${errorText}`,
        data: null,
      };
    }
    
    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);
    const entitiesData = data.data?.entities || data.entities || {};
    
    logger.info(`[PullSync] Received ${Object.keys(entitiesData).length} entities from server`);
    
    // ─── 2. Replace local data for each entity ───
    for (const entityName of ENTITIES) {
      const entityData = entitiesData[entityName];
      if (entityData && Array.isArray(entityData.records)) {
        await replaceEntityRecords(entityName, entityData.records);
      } else {
        // No records for this entity, clear it
        const repo = AppDataSource.getRepository(entityName);
        await repo.clear();
        await syncSnapshotService.updateSnapshot(entityName, 0, null, null);
        logger.info(`[PullSync] Cleared ${entityName} (no records from server)`);
      }
    }
    
    // ─── 3. Return success ───
    const totalRecords = Object.values(entitiesData).reduce(
      (sum, e) => sum + (e.records?.length || 0),
      0
    );
    
    logger.info(`[PullSync] Pull completed: ${totalRecords} records downloaded`);
    
    return {
      status: true,
      message: `Pull sync completed: ${totalRecords} records downloaded`,
      data: {
        totalRecords,
        entities: Object.keys(entitiesData),
      },
    };
    
  } catch (error) {
    logger.error("[PullSync] Error:", error);
    return {
      status: false,
      message: error.message || "Pull sync failed",
      data: null,
    };
  }
};