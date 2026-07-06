// src/main/ipc/core/debt/fix_precision.ipc.js
const debtService = require('../../../../services/Debt');
const onlineClient = require('../../../../utils/onlineClient');
const { syncMode, serverUrl } = require('../../../../utils/system');
const { extractData } = require('../../../../utils/responseTransformer');

module.exports = async (params, queryRunner) => {
  const { debtId = null } = params;
  const mode = await syncMode();

  if (mode === 'online') {
    const url = await serverUrl();
    if (!url) throw new Error('Server URL not configured');
    onlineClient.setBaseUrl(url);
    // Endpoint: POST /api/v1/debts/fix-precision/
    const response = await onlineClient.post('/api/v1/debts/fix-precision/', { debtId });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: 'Precision fixed on server',
      data: extractData(serverResult), // { fixed }
    };
  } else {
    const result = await debtService.fixFloatingPointPrecision(debtId, queryRunner);
    return {
      status: true,
      message: 'Precision fixed locally',
      data: result, // { fixed }
    };
  }
};