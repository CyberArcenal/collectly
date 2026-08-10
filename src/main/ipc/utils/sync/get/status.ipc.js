// src/main/ipc/utils/sync/get/status.ipc.js
//@ts-check
const syncService = require("../../../../../services/SyncService");
const syncSnapshotService = require("../../../../../services/SyncSnapshotService");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformSingle } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    try {
      const url = await serverUrl();
      if (!url) throw new Error("Server URL not configured");
      onlineClient.setBaseUrl(url);

      // Get server status (per-user metadata)
      const response = await onlineClient.get("/api/v1/sync/status/");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const serverResult = await response.json();
      const serverData = transformSingle(serverResult);

      // Get local snapshots
      const snapshots = await syncSnapshotService.getAllSnapshots();

      // Merge server data with local snapshots
      const mergedData = {
        ...serverData.data,
        localSnapshots: snapshots,
        entities: serverData.data.entities.map((entity) => {
          const snapshot = snapshots.find((s) => s.entity === entity.entity);
          return {
            ...entity,
            localRecordCount: snapshot?.recordCount || 0,
            localStatus: snapshot?.syncStatus || "idle",
            lastSyncTaskId: snapshot?.lastSyncTaskId || null,
            hasLocalChanges: snapshot ? true : false,
          };
        }),
        pendingChangesCount: snapshots.filter((s) => s.syncStatus === "syncing" || s.syncStatus === "failed").length,
      };

      return {
        status: true,
        message: "Sync status retrieved (merged)",
        data: mergedData,
      };

    } catch (error) {
      console.error("[Status IPC] Error fetching server status:", error);
      
      // Fallback: return local snapshots only
      const snapshots = await syncSnapshotService.getAllSnapshots();
      return {
        status: true,
        message: "Sync status retrieved locally (server unavailable)",
        data: {
          user: "system",
          totalEntities: snapshots.length,
          syncedEntities: snapshots.filter((s) => s.syncStatus === "completed").length,
          pendingSyncs: snapshots.filter((s) => s.syncStatus === "syncing" || s.syncStatus === "failed").length,
          totalRecordsSynced: snapshots.reduce((sum, s) => sum + s.recordCount, 0),
          lastSync: snapshots.length > 0 
            ? Math.max(...snapshots.filter(s => s.lastSyncedAt).map(s => s.lastSyncedAt.getTime()))
            : null,
          entities: snapshots.map((s) => ({
            entity: s.entity,
            status: s.syncStatus,
            lastSyncedAt: s.lastSyncedAt,
            recordCount: s.recordCount,
            totalSynced: s.recordCount,
            hasPending: s.syncStatus === "syncing" || s.syncStatus === "failed",
            localRecordCount: s.recordCount,
            localStatus: s.syncStatus,
          })),
          localSnapshots: snapshots,
          source: "local",
        },
      };
    }
  }

  // Offline mode - return local snapshots only
  const snapshots = await syncSnapshotService.getAllSnapshots();
  return {
    status: true,
    message: "Sync status retrieved (offline mode)",
    data: {
      user: "offline",
      totalEntities: snapshots.length,
      syncedEntities: snapshots.filter((s) => s.syncStatus === "completed").length,
      pendingSyncs: snapshots.filter((s) => s.syncStatus === "syncing" || s.syncStatus === "failed").length,
      totalRecordsSynced: snapshots.reduce((sum, s) => sum + s.recordCount, 0),
      lastSync: snapshots.length > 0 
        ? Math.max(...snapshots.filter(s => s.lastSyncedAt).map(s => s.lastSyncedAt.getTime()))
        : null,
      entities: snapshots.map((s) => ({
        entity: s.entity,
        status: s.syncStatus,
        lastSyncedAt: s.lastSyncedAt,
        recordCount: s.recordCount,
        totalSynced: s.recordCount,
        hasPending: s.syncStatus === "syncing" || s.syncStatus === "failed",
        localRecordCount: s.recordCount,
        localStatus: s.syncStatus,
      })),
      localSnapshots: snapshots,
      source: "local",
    },
  };
};