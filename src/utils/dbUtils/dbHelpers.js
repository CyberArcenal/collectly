const { AppDataSource } = require("../../db/data-source");

/**
 * Get repository for an entity
 * @param {string} entityName - Name of the entity (e.g., 'Borrower')
 * @param {import("typeorm").QueryRunner} [qr] - Optional query runner for transactions
 * @returns {Promise<import("typeorm").Repository>}
 */
async function getRepository(entityName, qr = null) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  // If query runner provided, use it
  if (qr && qr.manager) {
    return qr.manager.getRepository(entityName);
  }
  
  return AppDataSource.getRepository(entityName);
}

/**
 * Get repository by model name (converts to entity name)
 */
async function getRepositoryByModel(modelName, qr = null) {
  // Map model names to entity names if needed
  const entityMap = {
    'Borrower': 'Borrower',
    'Debt': 'Debt',
    'PaymentMethod': 'PaymentMethod',
    // ... add others as needed
  };
  
  const entityName = entityMap[modelName] || modelName;
  return getRepository(entityName, qr);
}

module.exports = {
  getRepository,
  getRepositoryByModel,
};