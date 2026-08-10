// src/main/ipc/utils/sync/get/status.ipc.js
//@ts-check
const syncService = require("../../../../../services/SyncService");
const syncSnapshotService = require("../../../../../services/SyncSnapshotService");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformSingle } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { AppDataSource } = require("../../../../db/data-source");

// Entity list (must match SyncService.entities)
const ENTITIES = [
  "PaymentMethod",
  "Borrower",
  "Debt",
  "LoanAgreement",
  "LoanApplication",
  "PaymentTransaction",
  "PenaltyTransaction",
];

/**
 * Get current record count for an entity from the local database.
 * Returns 0 if the repository is not available or an error occurs.
 */
async function getLocalRecordCount(entityName) {
  try {
    const repo = AppDataSource.getRepository(entityName);
    return await repo.count();
  } catch (error) {
    console.error(`[Status IPC] Failed to count ${entityName}:`, error);
    return 0;
  }
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    try {
      const url = await serverUrl();
      if (!url) throw new Error("Server URL not configured");
      onlineClient.setBaseUrl(url);

      // --- 1. Fetch status from server (per‑user metadata) ---
      const response = await onlineClient.get("/api/v1/sync/status/");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const serverResult = await response.json();
      const serverData = transformSingle(serverResult);

      // --- 2. Get local snapshots and current record counts ---
      const snapshots = await syncSnapshotService.getAllSnapshots();
      const localCounts = {};
      for (const entity of ENTITIES) {
        localCounts[entity] = await getLocalRecordCount(entity);
      }

      // --- 3. Merge server data with local counts ---
      const mergedData = {
        ...serverData.data,
        localSnapshots: snapshots,
        entities: serverData.data.entities.map((entity) => {
          const snapshot = snapshots.find((s) => s.entity === entity.entity);
          const localCount = localCounts[entity.entity] ?? 0;
          return {
            ...entity,
            // Current local record count – this is what the UI shows as "recordCount"
            recordCount: localCount,
            // Local count again (for clarity)
            localRecordCount: localCount,
            // Last synced count from the snapshot (if any)
            snapshotRecordCount: snapshot?.recordCount ?? 0,
            // Status from local snapshot (useful for pending indicators)
            localStatus: snapshot?.syncStatus || "idle",
            lastSyncTaskId: snapshot?.lastSyncTaskId || null,
            hasLocalChanges: snapshot ? snapshot.recordCount !== localCount : true,
          };
        }),
        pendingChangesCount: snapshots.filter(
          (s) => s.syncStatus === "syncing" || s.syncStatus === "failed"
        ).length,
      };

      return {
        status: true,
        message: "Sync status retrieved (merged with local counts)",
        data: mergedData,
      };
    } catch (error) {
      console.error("[Status IPC] Error fetching server status:", error);

      // --- Fallback: server unavailable – use local snapshots + current counts ---
      const snapshots = await syncSnapshotService.getAllSnapshots();
      const localCounts = {};
      for (const entity of ENTITIES) {
        localCounts[entity] = await getLocalRecordCount(entity);
      }

      const entities = ENTITIES.map((entity) => {
        const snapshot = snapshots.find((s) => s.entity === entity);
        const localCount = localCounts[entity] ?? 0;
        return {
          entity,
          status: snapshot?.syncStatus || "idle",
          lastSyncedAt: snapshot?.lastSyncedAt || null,
          recordCount: localCount,          // current local count
          totalSynced: snapshot?.recordCount || 0, // last synced count
          localRecordCount: localCount,
          snapshotRecordCount: snapshot?.recordCount || 0,
          hasLocalChanges: snapshot ? snapshot.recordCount !== localCount : true,
          hasError: snapshot?.syncStatus === "failed",
          errorMessage: snapshot?.syncStatus === "failed" ? "Sync failed" : null,
        };
      });

      return {
        status: true,
        message: "Sync status retrieved locally (server unavailable)",
        data: {
          user: "system",
          totalEntities: entities.length,
          syncedEntities: entities.filter((e) => e.status === "completed").length,
          pendingSyncs: entities.filter(
            (e) => e.status === "syncing" || e.status === "failed"
          ).length,
          totalRecordsSynced: entities.reduce(
            (sum, e) => sum + (e.totalSynced || 0),
            0
          ),
          lastSync: snapshots.length > 0
            ? Math.max(
                ...snapshots
                  .filter((s) => s.lastSyncedAt)
                  .map((s) => s.lastSyncedAt.getTime())
              )
            : null,
          entities,
          localSnapshots: snapshots,
          source: "local",
        },
      };
    }
  }

  // --- Offline mode – use local snapshots and current counts only ---
  const snapshots = await syncSnapshotService.getAllSnapshots();
  const localCounts = {};
  for (const entity of ENTITIES) {
    localCounts[entity] = await getLocalRecordCount(entity);
  }

  const entities = ENTITIES.map((entity) => {
    const snapshot = snapshots.find((s) => s.entity === entity);
    const localCount = localCounts[entity] ?? 0;
    return {
      entity,
      status: snapshot?.syncStatus || "idle",
      lastSyncedAt: snapshot?.lastSyncedAt || null,
      recordCount: localCount,
      totalSynced: snapshot?.recordCount || 0,
      localRecordCount: localCount,
      snapshotRecordCount: snapshot?.recordCount || 0,
      hasLocalChanges: snapshot ? snapshot.recordCount !== localCount : true,
      hasError: snapshot?.syncStatus === "failed",
      errorMessage: snapshot?.syncStatus === "failed" ? "Sync failed" : null,
    };
  });

  return {
    status: true,
    message: "Sync status retrieved (offline mode)",
    data: {
      user: "offline",
      totalEntities: entities.length,
      syncedEntities: entities.filter((e) => e.status === "completed").length,
      pendingSyncs: entities.filter(
        (e) => e.status === "syncing" || e.status === "failed"
      ).length,
      totalRecordsSynced: entities.reduce(
        (sum, e) => sum + (e.totalSynced || 0),
        0
      ),
      lastSync: snapshots.length > 0
        ? Math.max(
            ...snapshots
              .filter((s) => s.lastSyncedAt)
              .map((s) => s.lastSyncedAt.getTime())
          )
        : null,
      entities,
      localSnapshots: snapshots,
      source: "local",
    },
  };
};