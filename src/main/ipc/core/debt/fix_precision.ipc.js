// src/main/ipc/core/debt/fix_precision.ipc.js
const debtService = require('../../../../services/Debt');

module.exports = async (params, queryRunner) => {
  const { debtId = null } = params;
  const result = await debtService.fixFloatingPointPrecision(debtId, queryRunner);
  return {
    status: true,
    message: 'Precision fixed',
    data: result, // { fixed }
  };
};