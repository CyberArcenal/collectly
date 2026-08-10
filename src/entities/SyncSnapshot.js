// src/main/entities/SyncSnapshot.js

const { EntitySchema } = require("typeorm");

/**
 * SyncSnapshot Entity
 * 
 * Stores a lightweight snapshot of each entity's sync state.
 * Used for change detection and UI status display.
 * 
 * This replaces the old SyncMetadata, SyncConflict, and SyncQueue tables
 * with a single, simple table that only tracks what we need:
 * - When was the last sync?
 * - How many records were synced?
 * - What was the data hash? (for change detection)
 * - What is the sync status?
 */
const SyncSnapshot = new EntitySchema({
  name: "SyncSnapshot",
  tableName: "sync_snapshots",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    entity: {
      type: String,
      nullable: false,
      length: 100,
      unique: true,
      comment: "Entity name (e.g., 'Borrower', 'Debt', 'PaymentTransaction')",
    },
    lastSyncedAt: {
      type: Date,
      nullable: true,
      comment: "When this entity was last successfully synced",
    },
    recordCount: {
      type: Number,
      default: 0,
      comment: "Number of records at last sync",
    },
    dataHash: {
      type: String,
      nullable: true,
      length: 64,
      comment: "SHA-256 hash of all records (for change detection)",
    },
    lastSyncTaskId: {
      type: String,
      nullable: true,
      length: 100,
      comment: "Task ID of the last sync (for reference)",
    },
    syncStatus: {
      type: String,
      length: 20,
      default: "idle",
      enum: ["idle", "syncing", "completed", "failed"],
      comment: "Last sync status for this entity",
    },
    createdAt: {
      type: Date,
      createDate: true,
      comment: "When this snapshot was created",
    },
    updatedAt: {
      type: Date,
      updateDate: true,
      comment: "When this snapshot was last updated",
    },
  },
  indices: [
    { name: "IDX_SYNC_SNAPSHOT_ENTITY", columns: ["entity"] },
    { name: "IDX_SYNC_SNAPSHOT_STATUS", columns: ["syncStatus"] },
    { name: "IDX_SYNC_SNAPSHOT_LAST_SYNCED", columns: ["lastSyncedAt"] },
  ],
});

module.exports = SyncSnapshot;