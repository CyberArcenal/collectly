/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1784794241704 {
    name = 'InitSchema1784794241704'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "temporary_debts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "totalAmount" decimal(12,2) NOT NULL, "paidAmount" decimal(12,2) NOT NULL DEFAULT (0), "remainingAmount" decimal(12,2) NOT NULL DEFAULT (0), "dueDate" datetime NOT NULL, "status" varchar CHECK( "status" IN ('active','paid','overdue','defaulted') ) NOT NULL DEFAULT ('active'), "interestRate" decimal(5,2), "penaltyRate" decimal(5,2), "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastInterestAccrualDate" datetime, "interestCalculationPeriod" varchar CHECK( "interestCalculationPeriod" IN ('per_annum','per_month') ) NOT NULL DEFAULT ('per_annum'), "borrowerId" integer, CONSTRAINT "FK_04526b5d254ef76c4edb348d33b" FOREIGN KEY ("borrowerId") REFERENCES "borrowers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_debts"("id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "lastInterestAccrualDate", "interestCalculationPeriod", "borrowerId") SELECT "id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "lastInterestAccrualDate", "interestCalculationPeriod", "borrowerId" FROM "debts"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`ALTER TABLE "temporary_debts" RENAME TO "debts"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_METADATA_ENTITY"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_METADATA_STATUS"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_METADATA_LAST_SYNCED"`);
        await queryRunner.query(`CREATE TABLE "temporary_sync_metadata" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entity" varchar(100) NOT NULL, "lastSyncedAt" datetime, "lastSyncCount" integer NOT NULL DEFAULT (0), "totalSynced" integer NOT NULL DEFAULT (0), "status" varchar CHECK( "status" IN ('idle','syncing','completed','failed') ) NOT NULL DEFAULT ('idle'), "errorMessage" varchar(500), "lastSyncStartedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_c9e8aa33fc621d5ba37e42192b7" UNIQUE ("entity"))`);
        await queryRunner.query(`INSERT INTO "temporary_sync_metadata"("id", "entity", "lastSyncedAt", "lastSyncCount", "totalSynced", "status", "errorMessage", "lastSyncStartedAt", "createdAt", "updatedAt") SELECT "id", "entity", "lastSyncedAt", "lastSyncCount", "totalSynced", "status", "errorMessage", "lastSyncStartedAt", "createdAt", "updatedAt" FROM "sync_metadata"`);
        await queryRunner.query(`DROP TABLE "sync_metadata"`);
        await queryRunner.query(`ALTER TABLE "temporary_sync_metadata" RENAME TO "sync_metadata"`);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_METADATA_ENTITY" ON "sync_metadata" ("entity") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_METADATA_STATUS" ON "sync_metadata" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_METADATA_LAST_SYNCED" ON "sync_metadata" ("lastSyncedAt") `);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_CONFLICT_ENTITY"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_CONFLICT_RESOLUTION"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_CONFLICT_CREATED"`);
        await queryRunner.query(`CREATE TABLE "temporary_sync_conflicts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entity" varchar(100) NOT NULL, "entityId" integer NOT NULL, "localData" json, "serverData" json, "resolution" varchar CHECK( "resolution" IN ('pending','local','server','manual','merged') ) NOT NULL DEFAULT ('pending'), "resolvedBy" varchar(100), "resolvedAt" datetime, "localUpdatedAt" datetime, "serverUpdatedAt" datetime, "notes" varchar(500), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_sync_conflicts"("id", "entity", "entityId", "localData", "serverData", "resolution", "resolvedBy", "resolvedAt", "localUpdatedAt", "serverUpdatedAt", "notes", "createdAt", "updatedAt") SELECT "id", "entity", "entityId", "localData", "serverData", "resolution", "resolvedBy", "resolvedAt", "localUpdatedAt", "serverUpdatedAt", "notes", "createdAt", "updatedAt" FROM "sync_conflicts"`);
        await queryRunner.query(`DROP TABLE "sync_conflicts"`);
        await queryRunner.query(`ALTER TABLE "temporary_sync_conflicts" RENAME TO "sync_conflicts"`);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_CONFLICT_ENTITY" ON "sync_conflicts" ("entity", "entityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_CONFLICT_RESOLUTION" ON "sync_conflicts" ("resolution") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_CONFLICT_CREATED" ON "sync_conflicts" ("createdAt") `);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_QUEUE_STATUS"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_QUEUE_ENTITY"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_QUEUE_CREATED"`);
        await queryRunner.query(`CREATE TABLE "temporary_sync_queue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entity" varchar(100) NOT NULL, "entityId" integer NOT NULL, "action" varchar CHECK( "action" IN ('create','update','delete') ) NOT NULL, "data" json, "status" varchar CHECK( "status" IN ('pending','processing','completed','failed') ) NOT NULL DEFAULT ('pending'), "retryCount" integer NOT NULL DEFAULT (0), "maxRetries" integer NOT NULL DEFAULT (5), "errorMessage" varchar(500), "processedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_sync_queue"("id", "entity", "entityId", "action", "data", "status", "retryCount", "maxRetries", "errorMessage", "processedAt", "createdAt", "updatedAt") SELECT "id", "entity", "entityId", "action", "data", "status", "retryCount", "maxRetries", "errorMessage", "processedAt", "createdAt", "updatedAt" FROM "sync_queue"`);
        await queryRunner.query(`DROP TABLE "sync_queue"`);
        await queryRunner.query(`ALTER TABLE "temporary_sync_queue" RENAME TO "sync_queue"`);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_QUEUE_STATUS" ON "sync_queue" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_QUEUE_ENTITY" ON "sync_queue" ("entity", "entityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_QUEUE_CREATED" ON "sync_queue" ("createdAt") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_SYNC_QUEUE_CREATED"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_QUEUE_ENTITY"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_QUEUE_STATUS"`);
        await queryRunner.query(`ALTER TABLE "sync_queue" RENAME TO "temporary_sync_queue"`);
        await queryRunner.query(`CREATE TABLE "sync_queue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entity" varchar(100) NOT NULL, "entityId" integer NOT NULL, "action" varchar CHECK( "action" IN ('create','update','delete') ) NOT NULL, "data" json, "status" varchar CHECK( "status" IN ('pending','processing','completed','failed') ) NOT NULL DEFAULT ('pending'), "retryCount" integer NOT NULL DEFAULT (0), "maxRetries" integer NOT NULL DEFAULT (5), "errorMessage" varchar(500), "processedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "sync_queue"("id", "entity", "entityId", "action", "data", "status", "retryCount", "maxRetries", "errorMessage", "processedAt", "createdAt", "updatedAt") SELECT "id", "entity", "entityId", "action", "data", "status", "retryCount", "maxRetries", "errorMessage", "processedAt", "createdAt", "updatedAt" FROM "temporary_sync_queue"`);
        await queryRunner.query(`DROP TABLE "temporary_sync_queue"`);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_QUEUE_CREATED" ON "sync_queue" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_QUEUE_ENTITY" ON "sync_queue" ("entity", "entityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_QUEUE_STATUS" ON "sync_queue" ("status") `);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_CONFLICT_CREATED"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_CONFLICT_RESOLUTION"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_CONFLICT_ENTITY"`);
        await queryRunner.query(`ALTER TABLE "sync_conflicts" RENAME TO "temporary_sync_conflicts"`);
        await queryRunner.query(`CREATE TABLE "sync_conflicts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entity" varchar(100) NOT NULL, "entityId" integer NOT NULL, "localData" json, "serverData" json, "resolution" varchar CHECK( "resolution" IN ('pending','local','server','manual','merged') ) NOT NULL DEFAULT ('pending'), "resolvedBy" varchar(100), "resolvedAt" datetime, "localUpdatedAt" datetime, "serverUpdatedAt" datetime, "notes" varchar(500), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "sync_conflicts"("id", "entity", "entityId", "localData", "serverData", "resolution", "resolvedBy", "resolvedAt", "localUpdatedAt", "serverUpdatedAt", "notes", "createdAt", "updatedAt") SELECT "id", "entity", "entityId", "localData", "serverData", "resolution", "resolvedBy", "resolvedAt", "localUpdatedAt", "serverUpdatedAt", "notes", "createdAt", "updatedAt" FROM "temporary_sync_conflicts"`);
        await queryRunner.query(`DROP TABLE "temporary_sync_conflicts"`);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_CONFLICT_CREATED" ON "sync_conflicts" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_CONFLICT_RESOLUTION" ON "sync_conflicts" ("resolution") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_CONFLICT_ENTITY" ON "sync_conflicts" ("entity", "entityId") `);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_METADATA_LAST_SYNCED"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_METADATA_STATUS"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_METADATA_ENTITY"`);
        await queryRunner.query(`ALTER TABLE "sync_metadata" RENAME TO "temporary_sync_metadata"`);
        await queryRunner.query(`CREATE TABLE "sync_metadata" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entity" varchar(100) NOT NULL, "lastSyncedAt" datetime, "lastSyncCount" integer NOT NULL DEFAULT (0), "totalSynced" integer NOT NULL DEFAULT (0), "status" varchar CHECK( "status" IN ('idle','syncing','completed','failed') ) NOT NULL DEFAULT ('idle'), "errorMessage" varchar(500), "lastSyncStartedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_c9e8aa33fc621d5ba37e42192b7" UNIQUE ("entity"))`);
        await queryRunner.query(`INSERT INTO "sync_metadata"("id", "entity", "lastSyncedAt", "lastSyncCount", "totalSynced", "status", "errorMessage", "lastSyncStartedAt", "createdAt", "updatedAt") SELECT "id", "entity", "lastSyncedAt", "lastSyncCount", "totalSynced", "status", "errorMessage", "lastSyncStartedAt", "createdAt", "updatedAt" FROM "temporary_sync_metadata"`);
        await queryRunner.query(`DROP TABLE "temporary_sync_metadata"`);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_METADATA_LAST_SYNCED" ON "sync_metadata" ("lastSyncedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_METADATA_STATUS" ON "sync_metadata" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_METADATA_ENTITY" ON "sync_metadata" ("entity") `);
        await queryRunner.query(`ALTER TABLE "debts" RENAME TO "temporary_debts"`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "totalAmount" decimal(12,2) NOT NULL, "paidAmount" decimal(12,2) NOT NULL DEFAULT (0), "remainingAmount" decimal(12,2) NOT NULL DEFAULT (0), "dueDate" datetime NOT NULL, "status" varchar CHECK( "status" IN ('active','paid','overdue','defaulted') ) NOT NULL DEFAULT ('active'), "interestRate" decimal(5,2), "penaltyRate" decimal(5,2), "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastInterestAccrualDate" datetime, "interestCalculationPeriod" varchar CHECK( "interestCalculationPeriod" IN ('per_annum','per_month') ) NOT NULL DEFAULT ('per_annum'), "borrowerId" integer, CONSTRAINT "FK_04526b5d254ef76c4edb348d33b" FOREIGN KEY ("borrowerId") REFERENCES "borrowers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "debts"("id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "lastInterestAccrualDate", "interestCalculationPeriod", "borrowerId") SELECT "id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "lastInterestAccrualDate", "interestCalculationPeriod", "borrowerId" FROM "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "temporary_debts"`);
    }
}
