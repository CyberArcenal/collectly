/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1785916270582 {
    name = 'InitSchema1785916270582'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "sync_snapshots" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entity" varchar(100) NOT NULL, "lastSyncedAt" datetime, "recordCount" integer NOT NULL DEFAULT (0), "dataHash" varchar(64), "lastSyncTaskId" varchar(100), "syncStatus" varchar CHECK( "syncStatus" IN ('idle','syncing','completed','failed') ) NOT NULL DEFAULT ('idle'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_4d52d906bf8e1fdb90ee4221cbb" UNIQUE ("entity"))`);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_SNAPSHOT_ENTITY" ON "sync_snapshots" ("entity") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_SNAPSHOT_STATUS" ON "sync_snapshots" ("syncStatus") `);
        await queryRunner.query(`CREATE INDEX "IDX_SYNC_SNAPSHOT_LAST_SYNCED" ON "sync_snapshots" ("lastSyncedAt") `);
        await queryRunner.query(`CREATE TABLE "temporary_debts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "totalAmount" decimal(12,2) NOT NULL, "paidAmount" decimal(12,2) NOT NULL DEFAULT (0), "remainingAmount" decimal(12,2) NOT NULL DEFAULT (0), "dueDate" datetime NOT NULL, "status" varchar CHECK( "status" IN ('active','paid','overdue','defaulted') ) NOT NULL DEFAULT ('active'), "interestRate" decimal(5,2), "penaltyRate" decimal(5,2), "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastInterestAccrualDate" datetime, "interestCalculationPeriod" varchar CHECK( "interestCalculationPeriod" IN ('per_annum','per_month') ) NOT NULL DEFAULT ('per_annum'), "borrowerId" integer, CONSTRAINT "FK_04526b5d254ef76c4edb348d33b" FOREIGN KEY ("borrowerId") REFERENCES "borrowers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_debts"("id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "lastInterestAccrualDate", "interestCalculationPeriod", "borrowerId") SELECT "id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "lastInterestAccrualDate", "interestCalculationPeriod", "borrowerId" FROM "debts"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`ALTER TABLE "temporary_debts" RENAME TO "debts"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "debts" RENAME TO "temporary_debts"`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "totalAmount" decimal(12,2) NOT NULL, "paidAmount" decimal(12,2) NOT NULL DEFAULT (0), "remainingAmount" decimal(12,2) NOT NULL DEFAULT (0), "dueDate" datetime NOT NULL, "status" varchar CHECK( "status" IN ('active','paid','overdue','defaulted') ) NOT NULL DEFAULT ('active'), "interestRate" decimal(5,2), "penaltyRate" decimal(5,2), "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastInterestAccrualDate" datetime, "interestCalculationPeriod" varchar CHECK( "interestCalculationPeriod" IN ('per_annum','per_month') ) NOT NULL DEFAULT ('per_annum'), "borrowerId" integer, CONSTRAINT "FK_04526b5d254ef76c4edb348d33b" FOREIGN KEY ("borrowerId") REFERENCES "borrowers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "debts"("id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "lastInterestAccrualDate", "interestCalculationPeriod", "borrowerId") SELECT "id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "lastInterestAccrualDate", "interestCalculationPeriod", "borrowerId" FROM "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "temporary_debts"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_SNAPSHOT_LAST_SYNCED"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_SNAPSHOT_STATUS"`);
        await queryRunner.query(`DROP INDEX "IDX_SYNC_SNAPSHOT_ENTITY"`);
        await queryRunner.query(`DROP TABLE "sync_snapshots"`);
    }
}
