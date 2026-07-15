// src/main/entities/SyncMetadata.js
const { EntitySchema } = require("typeorm");

const SyncMetadata = new EntitySchema({
  name: "SyncMetadata",
  tableName: "sync_metadata",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    entity: {
      type: String,
      unique: true,
      nullable: false,
      length: 100,
      comment: "Entity name (e.g., 'Borrower', 'Debt', 'PaymentTransaction')",
    },
    lastSyncedAt: {
      type: Date,
      nullable: true,
      comment: "Last successful sync timestamp",
    },
    lastSyncCount: {
      type: Number,
      default: 0,
      comment: "Number of records synced in last sync",
    },
    totalSynced: {
      type: Number,
      default: 0,
      comment: "Total records synced since beginning",
    },
    status: {
      type: String,
      length: 20,
      default: "idle",
      enum: ["idle", "syncing", "completed", "failed"],
      comment: "Sync status for this entity",
    },
    errorMessage: {
      type: String,
      nullable: true,
      length: 500,
      comment: "Last error message if sync failed",
    },
    lastSyncStartedAt: {
      type: Date,
      nullable: true,
      comment: "When the last sync started",
    },
    createdAt: {
      type: Date,
      createDate: true,
    },
    updatedAt: {
      type: Date,
      updateDate: true,
    },
  },
  indices: [
    { name: "IDX_SYNC_METADATA_ENTITY", columns: ["entity"] },
    { name: "IDX_SYNC_METADATA_STATUS", columns: ["status"] },
    { name: "IDX_SYNC_METADATA_LAST_SYNCED", columns: ["lastSyncedAt"] },
  ],
});

module.exports = SyncMetadata;