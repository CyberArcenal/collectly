// src/main/ipc/utils/sync/full_sync.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");

/**
 * Get all entity names from sync service
 */
const ENTITIES = [
  'Borrower',
  'Debt',
  'PaymentTransaction',
  'PenaltyTransaction',
  'LoanAgreement',
  'LoanApplication',
  'PaymentMethod',
];

module.exports = async (params) => {
  const { user = "system", records = {} } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const results = {
      total: ENTITIES.length,
      completed: 0,
      failed: 0,
      errors: [],
      entities: {},
      tasks: [],
    };

    // For each entity, start a sync task
    for (const entityName of ENTITIES) {
      try {
        // Get all local records for this entity
        const entityData = await syncService.getEntityRecords(entityName);

        if (entityData.records.length === 0) {
          results.entities[entityName] = {
            status: 'skipped',
            count: 0,
            message: 'No records to sync',
          };
          results.completed++;
          continue;
        }

        // ✅ Start task-based sync
        const response = await onlineClient.post(`/api/v1/sync/${entityName}/`, {
          data: entityData.records,
          user: user,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const serverResult = await response.json();
        const data = transformKeysToCamelCase(serverResult);

        results.entities[entityName] = {
          status: 'task_queued',
          count: entityData.records.length,
          taskId: data.taskId,
        };
        results.tasks.push({
          entity: entityName,
          taskId: data.taskId,
          status: data.status,
        });
        results.completed++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          entity: entityName,
          error: error.message,
        });
        results.entities[entityName] = {
          status: 'failed',
          error: error.message,
        };
        console.error(`[FullSync] Failed to sync ${entityName}:`, error.message);
      }
    }

    return {
      status: true,
      message: `Full sync started: ${results.completed} tasks queued, ${results.failed} failed`,
      data: results,
    };
  }

  // Offline mode
  try {
    const result = await syncService.fullSync(user);
    return {
      status: true,
      message: "Full sync completed locally",
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Full sync failed",
      data: null,
    };
  }
};