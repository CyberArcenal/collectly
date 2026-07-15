// src/main/entities/SyncQueue.js
const { EntitySchema } = require("typeorm");

const SyncQueue = new EntitySchema({
  name: "SyncQueue",
  tableName: "sync_queue",
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
      comment: "Entity name",
    },
    entityId: {
      type: Number,
      nullable: false,
      comment: "ID of the record to sync",
    },
    action: {
      type: String,
      length: 20,
      enum: ["create", "update", "delete"],
      comment: "Action to perform",
    },
    data: {
      type: "json",
      nullable: true,
      comment: "Record data for create/update",
    },
    status: {
      type: String,
      length: 20,
      default: "pending",
      enum: ["pending", "processing", "completed", "failed"],
      comment: "Queue item status",
    },
    retryCount: {
      type: Number,
      default: 0,
      comment: "Number of retry attempts",
    },
    maxRetries: {
      type: Number,
      default: 5,
      comment: "Maximum retry attempts",
    },
    errorMessage: {
      type: String,
      nullable: true,
      length: 500,
      comment: "Last error message",
    },
    processedAt: {
      type: Date,
      nullable: true,
      comment: "When this item was processed",
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
    { name: "IDX_SYNC_QUEUE_STATUS", columns: ["status"] },
    { name: "IDX_SYNC_QUEUE_ENTITY", columns: ["entity", "entityId"] },
    { name: "IDX_SYNC_QUEUE_CREATED", columns: ["createdAt"] },
  ],
});

module.exports = SyncQueue;