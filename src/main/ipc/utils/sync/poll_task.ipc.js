// src/main/ipc/utils/sync/poll_task.ipc.js
//@ts-check
const syncSnapshotService = require("../../../../services/SyncSnapshotService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { AppDataSource } = require("../../../db/data-source");


// Entity list
const ENTITIES = [
  'PaymentMethod',
  'Borrower',
  'Debt',
  'LoanAgreement',
  'LoanApplication',
  'PaymentTransaction',
  'PenaltyTransaction',
];

/**
 * Update a local record's ID to match the server's ID
 * This preserves all data but changes the primary key
 */
async function updateLocalRecordId(entityName, clientId, serverId) {
  const { saveDb, updateDb, removeDb } = require("../../../../utils/dbUtils/dbActions");
  try {
    const repo = AppDataSource.getRepository(entityName);
    
    // Find the record with the client ID
    const record = await repo.findOne({ where: { id: clientId } });
    if (!record) {
      console.warn(`[PollTask] Record ${entityName}#${clientId} not found for ID update`);
      return false;
    }

    // Check if a record with the server ID already exists
    const existing = await repo.findOne({ where: { id: serverId } });
    if (existing) {
      // If server ID already exists, we should merge or skip
      console.warn(`[PollTask] Server ID ${serverId} already exists for ${entityName}, skipping update`);
      return false;
    }

    // Update the record's ID
    // We need to: delete old record, create new with new ID
    // Using raw SQL or repository operations
    const recordData = { ...record };
    recordData.id = serverId;
    
    // Remove the old record
    await removeDb(repo, record);
    console.log(`[PollTask] Removed old ${entityName} record with ID ${clientId}`);
    
    // Create new record with server ID
    const newRecord = repo.create(recordData);
    await saveDb(repo, newRecord);
    console.log(`[PollTask] Created new ${entityName} record with ID ${serverId}`);
    
    console.log(`[PollTask] Updated ${entityName} ID from ${clientId} to ${serverId}`);
    return true;
  } catch (error) {
    console.error(`[PollTask] Failed to update ID for ${entityName}#${clientId}:`, error);
    return false;
  }
}

module.exports = async (params) => {
  const { taskId, interval = 1000, timeout = 300000, onProgress } = params;

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

    // ─── Update snapshots based on task status ───
    if (data.status === "completed") {
      // ─── 1. Update local record IDs from server mapping ───
      const entitiesResult = data.result?.entities || {};
      
      for (const [entityName, entityData] of Object.entries(entitiesResult)) {
        const mappedIds = entityData?.mapped_ids || {};
        
        for (const [clientId, serverId] of Object.entries(mappedIds)) {
          // Skip if clientId and serverId are the same
          if (String(clientId) === String(serverId)) {
            continue;
          }
          await updateLocalRecordId(entityName, clientId, serverId);
        }
      }

      // ─── 2. Update snapshots for all entities ───
      for (const entityName of ENTITIES) {
        try {
          const repo = AppDataSource.getRepository(entityName);
          const count = await repo.count();
          
          await syncSnapshotService.updateSnapshot(
            entityName,
            count,
            null,  // hash optional
            taskId
          );
        } catch (err) {
          console.error(`[PollTask] Failed to update snapshot for ${entityName}:`, err);
        }
      }
      
      return {
        status: true,
        message: "Task completed",
        data: data,
      };
    }

    if (data.status === "failed") {
      // Mark all as failed
      for (const entityName of ENTITIES) {
        await syncSnapshotService.markFailed(entityName);
      }
      
      return {
        status: false,
        message: data.error || "Task failed",
        data: data,
      };
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};