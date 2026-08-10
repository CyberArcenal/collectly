// src/main/ipc/utils/sync/sync.utils.js
//@ts-check

const {
  ENTITY_REQUIRED_FIELDS,
  DATE_ONLY_FIELDS,
  DECIMAL_FIELDS,
} = require('./sync.config');

/**
 * Convert and format a single record:
 * - camelCase → snake_case
 * - Date objects → ISO string (datetime) or YYYY-MM-DD (date‑only)
 * - Decimal numbers → string with exactly 2 decimal places
 *
 * @param {Record<string, any>} record - The raw record from the database
 * @returns {Record<string, any>} Formatted record with snake_case keys
 */
function formatRecord(record) {
  const result = {};
  for (const [key, value] of Object.entries(record)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    let val = value;

    // Handle Date objects
    if (val instanceof Date) {
      if (DATE_ONLY_FIELDS.has(snakeKey)) {
        // Date‑only → YYYY-MM-DD
        val = val.toISOString().split('T')[0];
      } else {
        // Datetime → full ISO string
        val = val.toISOString();
      }
    }

    // If a string already contains an ISO datetime, extract the date part for date‑only fields
    if (typeof val === 'string' && DATE_ONLY_FIELDS.has(snakeKey)) {
      const isoMatch = val.match(/^(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) {
        val = isoMatch[1];
      }
    }

    // Decimal fields: round to 2 decimals and send as a string
    if (DECIMAL_FIELDS.has(snakeKey) && typeof val === 'number' && !isNaN(val)) {
      val = val.toFixed(2);
    }

    result[snakeKey] = val;
  }
  return result;
}

/**
 * Validate records for an entity against required fields.
 *
 * @param {string} entityName - Name of the entity
 * @param {Array<Record<string, any>>} records - Formatted records
 * @returns {{ validRecords: Array<Record<string, any>>, invalidRecords: Array<{id: any, missingFields: string[], record: Record<string, any>}> }}
 */
function validateRecords(entityName, records) {
  const requiredFields = ENTITY_REQUIRED_FIELDS[entityName] || [];
  const validRecords = [];
  const invalidRecords = [];

  for (const record of records) {
    const missingFields = requiredFields.filter(field => {
      const value = record[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      invalidRecords.push({
        id: record.id,
        missingFields,
        record,
      });
    } else {
      validRecords.push(record);
    }
  }

  return { validRecords, invalidRecords };
}

module.exports = {
  formatRecord,
  validateRecords,
};