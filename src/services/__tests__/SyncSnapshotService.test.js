// src/main/services/__tests__/SyncSnapshotService.test.js
//@ts-check
const { describe, it, expect, beforeEach, jest } = require("@jest/globals");
const syncSnapshotService = require("../SyncSnapshotService");

// Mock AppDataSource
jest.mock("../../db/data-source", () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getCount: jest.fn(),
      }),
    }),
  },
}));

describe("SyncSnapshotService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSnapshot", () => {
    it("should return snapshot for entity", async () => {
      const mockRepo = await syncSnapshotService.getRepository();
      const mockSnapshot = { entity: "Borrower", recordCount: 5 };
      mockRepo.findOne.mockResolvedValue(mockSnapshot);

      const result = await syncSnapshotService.getSnapshot("Borrower");
      expect(result).toEqual(mockSnapshot);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { entity: "Borrower" },
      });
    });

    it("should return null if snapshot not found", async () => {
      const mockRepo = await syncSnapshotService.getRepository();
      mockRepo.findOne.mockResolvedValue(null);

      const result = await syncSnapshotService.getSnapshot("Unknown");
      expect(result).toBeNull();
    });
  });

  describe("getAllSnapshots", () => {
    it("should return all snapshots", async () => {
      const mockRepo = await syncSnapshotService.getRepository();
      const mockSnapshots = [
        { entity: "Borrower", recordCount: 5 },
        { entity: "Debt", recordCount: 10 },
      ];
      mockRepo.find.mockResolvedValue(mockSnapshots);

      const result = await syncSnapshotService.getAllSnapshots();
      expect(result).toEqual(mockSnapshots);
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { entity: "ASC" } });
    });
  });

  describe("updateSnapshot", () => {
    it("should create new snapshot if none exists", async () => {
      const mockRepo = await syncSnapshotService.getRepository();
      mockRepo.findOne.mockResolvedValue(null);
      const mockCreated = { entity: "Borrower", recordCount: 5, syncStatus: "completed" };
      mockRepo.create.mockReturnValue(mockCreated);
      mockRepo.save.mockResolvedValue(mockCreated);

      const result = await syncSnapshotService.updateSnapshot("Borrower", 5, "hash123", "task123");
      expect(result).toEqual(mockCreated);
      expect(mockRepo.create).toHaveBeenCalledWith({
        entity: "Borrower",
        lastSyncedAt: expect.any(Date),
        recordCount: 5,
        dataHash: "hash123",
        lastSyncTaskId: "task123",
        syncStatus: "completed",
      });
    });

    it("should update existing snapshot", async () => {
      const mockRepo = await syncSnapshotService.getRepository();
      const existing = {
        entity: "Borrower",
        recordCount: 3,
        syncStatus: "idle",
        save: jest.fn(),
      };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockResolvedValue(existing);

      const result = await syncSnapshotService.updateSnapshot("Borrower", 10, "newhash", "task456");
      expect(existing.recordCount).toBe(10);
      expect(existing.dataHash).toBe("newhash");
      expect(existing.lastSyncTaskId).toBe("task456");
      expect(existing.syncStatus).toBe("completed");
      expect(mockRepo.save).toHaveBeenCalledWith(existing);
    });
  });

  describe("markSyncing", () => {
    it("should mark snapshot as syncing", async () => {
      const mockRepo = await syncSnapshotService.getRepository();
      const existing = { entity: "Borrower", syncStatus: "idle", save: jest.fn() };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockResolvedValue(existing);

      const result = await syncSnapshotService.markSyncing("Borrower");
      expect(existing.syncStatus).toBe("syncing");
      expect(mockRepo.save).toHaveBeenCalledWith(existing);
    });

    it("should create snapshot if not exists", async () => {
      const mockRepo = await syncSnapshotService.getRepository();
      mockRepo.findOne.mockResolvedValue(null);
      const created = { entity: "Borrower", syncStatus: "syncing" };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await syncSnapshotService.markSyncing("Borrower");
      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith({
        entity: "Borrower",
        syncStatus: "syncing",
      });
    });
  });

  describe("markFailed", () => {
    it("should mark snapshot as failed", async () => {
      const mockRepo = await syncSnapshotService.getRepository();
      const existing = { entity: "Borrower", syncStatus: "syncing", save: jest.fn() };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockResolvedValue(existing);

      const result = await syncSnapshotService.markFailed("Borrower");
      expect(existing.syncStatus).toBe("failed");
      expect(mockRepo.save).toHaveBeenCalledWith(existing);
    });
  });

  describe("computeEntityHash", () => {
    it("should return null for empty records", () => {
      const result = syncSnapshotService.computeEntityHash("Borrower", []);
      expect(result).toBeNull();
    });

    it("should compute consistent hash for records", () => {
      const records = [
        { id: 1, updatedAt: "2026-01-01T00:00:00Z" },
        { id: 2, updatedAt: "2026-01-02T00:00:00Z" },
      ];
      const hash1 = syncSnapshotService.computeEntityHash("Borrower", records);
      const hash2 = syncSnapshotService.computeEntityHash("Borrower", records);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should differ when records change", () => {
      const records1 = [
        { id: 1, updatedAt: "2026-01-01T00:00:00Z" },
        { id: 2, updatedAt: "2026-01-02T00:00:00Z" },
      ];
      const records2 = [
        { id: 1, updatedAt: "2026-01-01T00:00:00Z" },
        { id: 2, updatedAt: "2026-01-03T00:00:00Z" }, // changed
      ];
      const hash1 = syncSnapshotService.computeEntityHash("Borrower", records1);
      const hash2 = syncSnapshotService.computeEntityHash("Borrower", records2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("hasEntityChanged", () => {
    it("should return changed if no snapshot", async () => {
      jest.spyOn(syncSnapshotService, "getSnapshot").mockResolvedValue(null);
      const result = await syncSnapshotService.hasEntityChanged("Borrower", []);
      expect(result.changed).toBe(true);
      expect(result.reason).toBe("Never synced before");
    });

    it("should return not changed if hash matches", async () => {
      const snapshot = {
        entity: "Borrower",
        dataHash: "abc123",
        recordCount: 2,
      };
      jest.spyOn(syncSnapshotService, "getSnapshot").mockResolvedValue(snapshot);
      jest
        .spyOn(syncSnapshotService, "computeEntityHash")
        .mockReturnValue("abc123");

      const result = await syncSnapshotService.hasEntityChanged("Borrower", []);
      expect(result.changed).toBe(false);
      expect(result.reason).toBe("No changes detected");
    });

    it("should return changed if hash differs", async () => {
      const snapshot = {
        entity: "Borrower",
        dataHash: "abc123",
        recordCount: 2,
      };
      jest.spyOn(syncSnapshotService, "getSnapshot").mockResolvedValue(snapshot);
      jest
        .spyOn(syncSnapshotService, "computeEntityHash")
        .mockReturnValue("def456");

      const result = await syncSnapshotService.hasEntityChanged("Borrower", []);
      expect(result.changed).toBe(true);
      expect(result.reason).toBe("Data has changed");
    });
  });
});