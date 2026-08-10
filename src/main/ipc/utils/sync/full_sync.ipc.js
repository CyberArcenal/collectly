// src/main/ipc/utils/sync/full_sync.ipc.js
//@ts-check
const syncService = require("../../../../services/SyncService");
const syncSnapshotService = require("../../../../services/SyncSnapshotService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { AppDataSource } = require("../../../db/data-source");

// Entity list in correct order (matching backend)
const ENTITIES = [
  'PaymentMethod',
  'Borrower',
  'Debt',
  'LoanAgreement',
  'LoanApplication',
  'PaymentTransaction',
  'PenaltyTransaction',
];

// Required fields per entity (must match server-side validation)
const ENTITY_REQUIRED_FIELDS = {
  'PaymentMethod': ['name'],
  'Borrower': ['name'],
  'Debt': ['name', 'total_amount', 'due_date', 'borrower_id'],
  'LoanAgreement': ['debt_id'],
  'LoanApplication': ['requested_amount', 'debtor_name', 'purpose', 'proposed_due_date'],
  'PaymentTransaction': ['amount', 'payment_date', 'debt_id'],
  'PenaltyTransaction': ['amount', 'penalty_date', 'debt_id'],
};

/**
 * Validate records for an entity against required fields.
 * Returns { validRecords, invalidRecords }.
 */
function validateRecords(entityName, records) {
  const requiredFields = ENTITY_REQUIRED_FIELDS[entityName] || [];
  const validRecords = [];
  const invalidRecords = [];

  for (const record of records) {
    const missingFields = requiredFields.filter(field => {
      const value = record[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      invalidRecords.push({
        id: record.id,
        missingFields,
        record: record,
      });
    } else {
      validRecords.push(record);
    }
  }

  return { validRecords, invalidRecords };
}

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
    // ─── 1. Load all data from local database ───
    const entitiesData = {};
    let totalValidRecords = 0;
    let totalInvalidRecords = 0;
    const invalidDetails = {};

    for (const entityName of ENTITIES) {
      const repo = AppDataSource.getRepository(entityName);
      const records = await repo.find();

      // Validate records
      const { validRecords, invalidRecords } = validateRecords(entityName, records);

      if (invalidRecords.length > 0) {
        totalInvalidRecords += invalidRecords.length;
        invalidDetails[entityName] = invalidRecords;
        console.warn(`[FullSync] ${entityName}: ${invalidRecords.length} records skipped (missing required fields)`);
        // Optionally log details for debugging
        console.debug(`[FullSync] Invalid ${entityName} records:`, invalidRecords);
      }

      // Mark as syncing in snapshot (we'll update after server response)
      await syncSnapshotService.markSyncing(entityName);

      // Convert valid records to plain objects with ISO dates
      entitiesData[entityName] = {
        records: validRecords.map((r) => {
          const obj = {};
          for (const key of Object.keys(r)) {
            if (r[key] instanceof Date) {
              obj[key] = r[key].toISOString();
            } else {
              obj[key] = r[key];
            }
          }
          return obj;
        }),
      };

      totalValidRecords += validRecords.length;
    }

    // If there are no valid records, we can still send empty payload, but we might want to return early?
    if (totalValidRecords === 0) {
      // No data to sync – mark all as idle and return
      for (const entityName of ENTITIES) {
        await syncSnapshotService.resetSnapshot(entityName);
      }
      return {
        status: true,
        message: "No valid records to sync",
        data: { taskId: null, status: "idle", entities: ENTITIES, totalRecords: 0 },
      };
    }

    // ─── 2. Send to server ───
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

      // Mark all as failed
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

    // ─── 3. Return task info ───
    // Include info about skipped invalid records
    const resultData = {
      taskId: data.data?.taskId || data.taskId,
      status: data.data?.status || data.status || "queued",
      entities: data.data?.entities || data.entities || ENTITIES,
      totalRecords: data.data?.totalRecords || data.totalRecords || totalValidRecords,
      skippedRecords: totalInvalidRecords,
      invalidDetails: totalInvalidRecords > 0 ? invalidDetails : undefined,
    };

    return {
      status: true,
      message: totalInvalidRecords > 0
        ? `Full sync started (${totalValidRecords} valid records, ${totalInvalidRecords} skipped due to missing fields)`
        : data.message || "Full sync started",
      data: resultData,
    };

  } catch (error) {
    console.error("[FullSync] Error:", error);

    // Mark all as failed
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