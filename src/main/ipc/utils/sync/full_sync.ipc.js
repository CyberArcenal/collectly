// src/main/ipc/utils/sync/full_sync.ipc.js
//@ts-check
const syncService = require("../../../../services/SyncService");
const syncSnapshotService = require("../../../../services/SyncSnapshotService");
const { logger } = require("../../../../utils/logger");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { AppDataSource } = require("../../../db/data-source");
const { ENTITIES } = require("./sync.config");
const { formatRecord, validateRecords } = require("./sync.utils");

module.exports = async (params) => {
  const { user = "system", metadata = {} } = params;
  const mode = await syncMode();

  if (mode !== "online") {
    return {
      status: false,
      message: "Full sync requires online mode",
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
    const entitiesData = {};
    let totalValidRecords = 0;
    let totalInvalidRecords = 0;
    const invalidDetails = {};

    for (const entityName of ENTITIES) {
      const repo = AppDataSource.getRepository(entityName);
      const records = await repo.find();

      const formattedRecords = records.map(formatRecord);
      const { validRecords, invalidRecords } = validateRecords(entityName, formattedRecords);

      if (invalidRecords.length > 0) {
        totalInvalidRecords += invalidRecords.length;
        invalidDetails[entityName] = invalidRecords;
        logger.warn(`[FullSync] ${entityName}: ${invalidRecords.length} records skipped (missing required fields)`);
      }

      await syncSnapshotService.markSyncing(entityName);

      entitiesData[entityName] = {
        records: validRecords,
      };

      totalValidRecords += validRecords.length;
    }

    if (totalValidRecords === 0) {
      for (const entityName of ENTITIES) {
        await syncSnapshotService.resetSnapshot(entityName);
      }
      return {
        status: true,
        message: "No valid records to sync",
        data: { taskId: null, status: "idle", entities: ENTITIES, totalRecords: 0 },
      };
    }

    const response = await onlineClient.post("/api/v1/sync/full/", {
      entities: entitiesData,
      metadata: {
        client_user: user,
        device_id: metadata.deviceId || null,
        app_version: metadata.appVersion || null,
        ...metadata,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      for (const entityName of ENTITIES) {
        await syncSnapshotService.markFailed(entityName);
      }
      return {
        status: false,
        message: `Server error: ${response.status} - ${errorText}`,
        data: null,
      };
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);

    const resultData = {
      taskId: data.data?.taskId || data.taskId,
      status: data.data?.status || data.status || "queued",
      entities: data.data?.entities || data.entities || ENTITIES,
      totalRecords: data.data?.totalRecords || data.totalRecords || totalValidRecords,
      skippedRecords: totalInvalidRecords,
      invalidDetails: totalInvalidRecords > 0 ? invalidDetails : undefined,
    };

    // ─── 🆕 Subscribe to WebSocket for progress ───
    if (resultData.taskId) {
      try {
        // Ensure WS client is connected
        await syncService._ensureWsConnected();
        // Send subscribe message
        syncService.wsClient.send({
          type: 'subscribe',
          taskId: resultData.taskId,
        });
        logger.info(`[FullSync] Subscribed to WS for task ${resultData.taskId}`);
      } catch (wsError) {
        // If WS fails, we fall back to polling (but we won't)
        logger.warn('[FullSync] Failed to subscribe via WebSocket, but sync continues:', wsError.message);
        // No error thrown – sync will continue, but progress won't be real-time
      }
    }

    return {
      status: true,
      message: totalInvalidRecords > 0
        ? `Full sync started (${totalValidRecords} valid records, ${totalInvalidRecords} skipped due to missing fields)`
        : data.message || "Full sync started",
      data: resultData,
    };

  } catch (error) {
    logger.error("[FullSync] Error:", error);
    for (const entityName of ENTITIES) {
      await syncSnapshotService.markFailed(entityName);
    }
    return {
      status: false,
      message: error.message || "Full sync failed",
      data: null,
    };
  }
};