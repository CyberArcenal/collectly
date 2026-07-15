// src/main/ipc/utils/sync/full_sync.ipc.js
const syncService = require("../../../../services/SyncService");
const onlineClient = require("../../../../utils/onlineClient");
const { transformKeysToCamelCase } = require("../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../utils/system");


/**
 * Get all entity names from sync service
 */
const ENTITIES = [
    'Borrower',
    'Debt',
    'PaymentTransaction',
    'PenaltyTransaction',
    'LoanAgreement',
    'LoanApplication',
    'PaymentMethod',
];

module.exports = async (params) => {
    const { user = "system"} = params;
    const mode = await syncMode();

    if (mode === "online") {
        const url = await serverUrl();
        if (!url) throw new Error("Server URL not configured");
        onlineClient.setBaseUrl(url);

        const results = {
            total: ENTITIES.length,
            completed: 0,
            failed: 0,
            errors: [],
            entities: {},
        };

        // For each entity, sync all records
        for (const entityName of ENTITIES) {
            try {
                // Get all local records for this entity
                const entityData = await syncService.getEntityRecords(entityName);
                
                if (entityData.records.length === 0) {
                    results.entities[entityName] = {
                        status: 'skipped',
                        count: 0,
                        message: 'No records to sync',
                    };
                    results.completed++;
                    continue;
                }

                // Send to server
                const response = await onlineClient.post(`/api/v1/sync/${entityName}/`, {
                    data: entityData.records,
                    user: user,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error: ${response.status} - ${errorText}`);
                }

                const serverResult = await response.json();
                const data = transformKeysToCamelCase(serverResult);

                results.entities[entityName] = {
                    status: 'completed',
                    count: entityData.records.length,
                    result: data,
                };
                results.completed++;

            } catch (error) {
                results.failed++;
                results.errors.push({
                    entity: entityName,
                    error: error.message,
                });
                results.entities[entityName] = {
                    status: 'failed',
                    error: error.message,
                };
                console.error(`[FullSync] Failed to sync ${entityName}:`, error.message);
            }
        }

        return {
            status: true,
            message: `Full sync completed: ${results.completed} succeeded, ${results.failed} failed`,
            data: results,
        };
    }

    // Offline mode
    try {
        const result = await syncService.fullSync(user);
        return {
            status: true,
            message: "Full sync completed locally",
            data: result,
        };
    } catch (error) {
        return {
            status: false,
            message: error.message || "Full sync failed",
            data: null,
        };
    }
};