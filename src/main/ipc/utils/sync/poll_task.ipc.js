// src/main/ipc/utils/sync/poll_task.ipc.js
//@ts-check
const syncSnapshotService = require("../../../../services/SyncSnapshotService");
const onlineClient = require("../../../../utils/onlineClient");
const {
  transformKeysToCamelCase,
} = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { AppDataSource } = require("../../../db/data-source");
const { ENTITIES } = require("./sync.config");
const {logger} = require("../../../../utils/logger");

async function updateLocalRecordId(entityName, clientId, serverId) {
  const { saveDb, removeDb } = require("../../../../utils/dbUtils/dbActions");
  try {
    const repo = AppDataSource.getRepository(entityName);
    const record = await repo.findOne({ where: { id: clientId } });
    if (!record) {
      logger.warn(`[PollTask] Record ${entityName}#${clientId} not found for ID update`);
      return false;
    }

    const existing = await repo.findOne({ where: { id: serverId } });
    if (existing) {
      logger.warn(`[PollTask] Server ID ${serverId} already exists for ${entityName}, skipping update`);
      return false;
    }

    const recordData = { ...record };
    recordData.id = serverId;

    await removeDb(repo, record);
    const newRecord = repo.create(recordData);
    await saveDb(repo, newRecord);

    logger.debug(`[PollTask] Updated ${entityName} ID from ${clientId} to ${serverId}`);
    return true;
  } catch (error) {
    logger.error(`[PollTask] Failed to update ID for ${entityName}#${clientId}:`, error);
    return false;
  }
}

module.exports = async (params) => {
  const { taskId, interval = 1000, timeout = 300000 } = params;

  if (!taskId) {
    return {
      status: false,
      message: "taskId is required",
      data: null,
    };
  }

  const mode = await syncMode();
  if (mode !== "online") {
    return {
      status: false,
      message: "Polling only available in online mode",
      data: null,
    };
  }

  const url = await serverUrl();
  if (!url) throw new Error("Server URL not configured");
  onlineClient.setBaseUrl(url);

  const startTime = Date.now();
  let lastProgress = null;

  while (true) {
    if (Date.now() - startTime > timeout) {
      return {
        status: false,
        message: "Polling timed out",
        data: lastProgress,
      };
    }

    const response = await onlineClient.get(`/api/v1/sync/task/${taskId}/`);
    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: false,
          message: "Task not found",
          data: null,
        };
      }
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    const data = transformKeysToCamelCase(serverResult);
    lastProgress = data;

    if (data.status === "completed") {
      const entitiesResult = data.result?.entities || {};

      for (const [entityName, entityData] of Object.entries(entitiesResult)) {
        const mappedIds = entityData?.mapped_ids || {};

        // Update snapshot only if the entity was processed
        if (entityData.processed && entityData.count !== undefined) {
          await syncSnapshotService.updateSnapshot(
            entityName,
            entityData.count,
            null,
            taskId
          );
        } else {
          // If not processed, we might want to mark as completed with existing count
          // but we'll keep it as is.
          logger.debug(`[PollTask] Entity ${entityName} not processed in this task`);
        }

        for (const [clientId, serverId] of Object.entries(mappedIds)) {
          if (String(clientId) === String(serverId)) continue;
          await updateLocalRecordId(entityName, clientId, serverId);
        }
      }

      return {
        status: true,
        message: "Task completed",
        data: data,
      };
    }

    if (data.status === "failed") {
      for (const entityName of ENTITIES) {
        await syncSnapshotService.markFailed(entityName);
      }
      return {
        status: false,
        message: data.error || "Task failed",
        data: data,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};