// src/main/ipc/utils/sync/__tests__/full_sync.test.js

const { describe, it, expect, jest } = require("@jest/globals");
const fullSyncHandler = require("../full_sync.ipc");
const syncService = require("../../../../../services/SyncService");
const syncSnapshotService = require("../../../../../services/SyncSnapshotService");

// Mock dependencies
jest.mock("../../../../../services/SyncService");
jest.mock("../../../../../services/SyncSnapshotService");
jest.mock("../../../../../utils/onlineClient");
jest.mock("../../../../../utils/system");
jest.mock("../../../../../db/data-source");

describe("full_sync.ipc", () => {
  it("should return error if offline", async () => {
    const { syncMode } = require("../../../../../utils/system");
    syncMode.mockResolvedValue("offline");

    const result = await fullSyncHandler({ user: "test" });
    expect(result.status).toBe(false);
    expect(result.message).toBe("Full sync requires online mode");
  });

  it("should return error if server URL not configured", async () => {
    const { syncMode, serverUrl } = require("../../../../../utils/system");
    syncMode.mockResolvedValue("online");
    serverUrl.mockResolvedValue(null);

    const result = await fullSyncHandler({ user: "test" });
    expect(result.status).toBe(false);
    expect(result.message).toBe("Server URL not configured");
  });

  it("should mark entities as syncing and call syncService.fullSync", async () => {
    const { syncMode, serverUrl } = require("../../../../../utils/system");
    const { AppDataSource } = require("../../../../../db/data-source");
    syncMode.mockResolvedValue("online");
    serverUrl.mockResolvedValue("http://localhost:3000");

    // Mock repositories
    const mockRepo = {
      find: jest.fn().mockResolvedValue([]),
    };
    AppDataSource.getRepository = jest.fn().mockReturnValue(mockRepo);

    syncSnapshotService.markSyncing = jest.fn().mockResolvedValue({});
    syncService.fullSync = jest.fn().mockResolvedValue({
      taskId: "task123",
      status: "queued",
      entities: ["Borrower"],
      totalRecords: 0,
    });

    const result = await fullSyncHandler({ user: "test", metadata: {} });
    expect(result.status).toBe(true);
    expect(result.data.taskId).toBe("task123");
    expect(syncSnapshotService.markSyncing).toHaveBeenCalled();
    expect(syncService.fullSync).toHaveBeenCalled();
  });
});