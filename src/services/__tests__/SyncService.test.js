// src/main/services/__tests__/SyncService.test.js

const { describe, it, expect, jest } = require("@jest/globals");
const syncService = require("../SyncService");

// Mock dependencies
jest.mock("../SyncSnapshotService");
jest.mock("../../utils/onlineClient");
jest.mock("../../utils/system");

describe("SyncService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isSyncAvailable", () => {
    it("should return available when online and server reachable", async () => {
      const { syncMode, serverUrl } = require("../../utils/system");
      const onlineClient = require("../../utils/onlineClient");
      syncMode.mockResolvedValue("online");
      serverUrl.mockResolvedValue("http://localhost:3000");
      onlineClient.get = jest.fn().mockResolvedValue({ ok: true });

      const result = await syncService.isSyncAvailable();
      expect(result).toEqual({ available: true });
    });

    it("should return not available when offline", async () => {
      const { syncMode } = require("../../utils/system");
      syncMode.mockResolvedValue("offline");

      const result = await syncService.isSyncAvailable();
      expect(result).toEqual({
        available: false,
        message: "App is in offline mode",
      });
    });
  });

  describe("fullSync", () => {
    it("should throw if sync not available", async () => {
      jest.spyOn(syncService, "isSyncAvailable").mockResolvedValue({
        available: false,
        message: "Offline",
      });
      await expect(syncService.fullSync()).rejects.toThrow("Sync not available");
    });

    it("should call onlineClient.post with correct payload", async () => {
      const onlineClient = require("../../utils/onlineClient");
      const { serverUrl } = require("../../utils/system");
      const { AppDataSource } = require("../../db/data-source");

      jest.spyOn(syncService, "isSyncAvailable").mockResolvedValue({
        available: true,
      });
      serverUrl.mockResolvedValue("http://localhost:3000");

      // Mock database repositories
      const mockRepo = {
        find: jest.fn().mockResolvedValue([]),
      };
      AppDataSource.getRepository = jest.fn().mockReturnValue(mockRepo);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: { taskId: "task123", status: "queued" },
        }),
      };
      onlineClient.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await syncService.fullSync("testuser", {
        deviceId: "device123",
      });

      expect(onlineClient.post).toHaveBeenCalledWith(
        "/api/v1/sync/full/",
        expect.objectContaining({
          metadata: {
            client_user: "testuser",
            device_id: "device123",
            app_version: undefined,
          },
        })
      );
      expect(result).toEqual({
        taskId: "task123",
        status: "queued",
        entities: expect.any(Array),
        totalRecords: 0,
      });
    });
  });

  describe("getSyncStatus", () => {
    it("should merge server status with local snapshots", async () => {
      const syncSnapshotService = require("../SyncSnapshotService");
      jest.spyOn(syncService, "_getServerSyncStatus").mockResolvedValue({
        totalEntities: 7,
        entities: [{ entity: "Borrower", status: "completed" }],
      });
      syncSnapshotService.getAllSnapshots.mockResolvedValue([
        { entity: "Borrower", recordCount: 10, syncStatus: "idle" },
      ]);

      const result = await syncService.getSyncStatus();
      expect(result).toMatchObject({
        totalEntities: 7,
        entities: expect.arrayContaining([
          expect.objectContaining({
            entity: "Borrower",
            localRecordCount: 10,
            combinedStatus: "completed",
          }),
        ]),
      });
    });
  });

  describe("getPendingChanges", () => {
    it("should return entities with changes", async () => {
      const { AppDataSource } = require("../../db/data-source");
      const syncSnapshotService = require("../SyncSnapshotService");

      const mockRepo = {
        find: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      };
      AppDataSource.getRepository = jest.fn().mockReturnValue(mockRepo);

      syncSnapshotService.hasEntityChanged = jest.fn().mockResolvedValue({
        changed: true,
        reason: "Data changed",
        currentCount: 2,
        previousCount: 1,
      });

      const result = await syncService.getPendingChanges();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        entity: "Borrower",
        changed: true,
        currentCount: 2,
        previousCount: 1,
      });
    });
  });
});