// src/main/ipc/debt/mark_period_paid.ipc.js
const debtService = require('../../../../services/Debt');
const onlineClient = require('../../../../utils/onlineClient');
const { syncMode, serverUrl } = require('../../../../utils/system');
const { extractData } = require('../../../../utils/responseTransformer');

module.exports = async (params, queryRunner) => {
  const { borrowerId, periodType, paymentDate, methodId, user = 'system' } = params;

  // Validate required fields
  if (!borrowerId) throw new Error('borrowerId is required');
  if (!periodType) throw new Error('periodType is required');
  if (!paymentDate) throw new Error('paymentDate is required');
  if (!methodId) throw new Error('methodId is required');

  const mode = await syncMode();

  if (mode === 'online') {
    const url = await serverUrl();
    if (!url) throw new Error('Server URL not configured');
    onlineClient.setBaseUrl(url);
    // Endpoint: POST /api/v1/debts/mark-period-paid/
    const response = await onlineClient.post('/api/v1/debts/mark-period-paid/', {
      borrowerId,
      periodType,
      paymentDate,
      methodId,
      user,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: 'Period marked paid on server',
      data: extractData(serverResult), // { payments, count }
    };
  } else {
    const result = await debtService.markPeriodPaid(borrowerId, periodType, paymentDate, methodId, user, queryRunner);
    return {
      status: true,
      message: 'Period marked paid locally',
      data: result,
    };
  }
};