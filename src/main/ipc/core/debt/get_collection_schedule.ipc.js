// src/main/ipc/core/debt/get_collection_schedule.ipc.js

const debtService = require('../../../../services/Debt');
const onlineClient = require('../../../../utils/onlineClient');
const { syncMode, serverUrl } = require('../../../../utils/system');

module.exports = async (params, queryRunner) => {
  const { periodType = 'monthly', asOfDate = null } = params;
  const mode = await syncMode();

  if (mode === 'online') {
    const url = await serverUrl();
    if (!url) throw new Error('Server URL not configured');
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/debts/collection-schedule', {
      params: { periodType, asOfDate },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: 'Collection schedule fetched from server', data: result };
  } else {
    const result = await debtService.getCollectionSchedule(periodType, asOfDate, queryRunner);
    return { status: true, message: 'Collection schedule fetched locally', data: result };
  }
};