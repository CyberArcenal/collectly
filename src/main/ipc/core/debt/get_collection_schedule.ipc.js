// src/main/ipc/core/debt/get_collection_schedule.ipc.js
//@ts-check
const debtService = require('../../../../services/Debt');
const onlineClient = require('../../../../utils/onlineClient');
const { syncMode, serverUrl } = require('../../../../utils/system');
const { extractData, transformKeysToCamelCase } = require('../../../../utils/responseTransformer');

/**
 * Fetch the collection schedule for a given period type and date.
 * @param {Object} params - The parameters for the request.
 * @param {string} params.periodType - The type of period (e.g., 'monthly').
 * @param {string|null} params.asOfDate - The date as of which to fetch the schedule.
 * @param {Object} queryRunner - The database query runner.
 * @returns {Promise<Object>} - A promise resolving to the fetched collection schedule.
 */
module.exports = async (params, queryRunner) => {
  const { periodType = 'monthly', asOfDate = null } = params;
  const mode = await syncMode();

  if (mode === 'online') {
    const url = await serverUrl();
    if (!url) throw new Error('Server URL not configured');
    onlineClient.setBaseUrl(url);

    // Map frontend param names to backend API param names (snake_case)
    const queryParams = {
      period_type: periodType,
    };
    if (asOfDate) {
      queryParams.as_of_date = asOfDate;
    }

    const response = await onlineClient.get('/api/v1/debts/collection-schedule/', {
      params: queryParams,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    // Extract the data field and transform keys from snake_case to camelCase
    const rawData = extractData(serverResult);
    const transformedData = rawData ? transformKeysToCamelCase(rawData) : null;

    return {
      status: true,
      message: 'Collection schedule fetched from server',
      data: transformedData,
    };
  } else {
    // Offline mode: use local service
    const result = await debtService.getCollectionSchedule(periodType, asOfDate, queryRunner);
    return {
      status: true,
      message: 'Collection schedule fetched locally',
      data: result,
    };
  }
};