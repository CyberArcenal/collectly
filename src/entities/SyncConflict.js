// src/main/entities/SyncConflict.js
const { EntitySchema } = require("typeorm");

const SyncConflict = new EntitySchema({
  name: "SyncConflict",
  tableName: "sync_conflicts",
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
      comment: "Entity name where conflict occurred",
    },
    entityId: {
      type: Number,
      nullable: false,
      comment: "ID of the record with conflict",
    },
    localData: {
      type: "json",
      nullable: true,
      comment: "Local version of the record",
    },
    serverData: {
      type: "json",
      nullable: true,
      comment: "Server version of the record",
    },
    resolution: {
      type: String,
      length: 20,
      default: "pending",
      enum: ["pending", "local", "server", "manual", "merged"],
      comment: "How the conflict was resolved",
    },
    resolvedBy: {
      type: String,
      nullable: true,
      length: 100,
      comment: "User who resolved the conflict",
    },
    resolvedAt: {
      type: Date,
      nullable: true,
      comment: "When the conflict was resolved",
    },
    localUpdatedAt: {
      type: Date,
      nullable: true,
      comment: "Local record's updatedAt timestamp",
    },
    serverUpdatedAt: {
      type: Date,
      nullable: true,
      comment: "Server record's updatedAt timestamp",
    },
    notes: {
      type: String,
      nullable: true,
      length: 500,
      comment: "Additional notes about the conflict",
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
    { name: "IDX_SYNC_CONFLICT_ENTITY", columns: ["entity", "entityId"] },
    { name: "IDX_SYNC_CONFLICT_RESOLUTION", columns: ["resolution"] },
    { name: "IDX_SYNC_CONFLICT_CREATED", columns: ["createdAt"] },
  ],
});

module.exports = SyncConflict;