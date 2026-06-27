// src/utils/currencyFormatter.js

/**
 * Format a number as currency with proper comma separators and decimal places
 * @param {number|string} amount - The amount to format
 * @param {Object} options - Formatting options
 * @param {string} options.symbol - Currency symbol (default: '₱')
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @param {boolean} options.showSymbol - Whether to show the symbol (default: true)
 * @param {string} options.locale - Locale for formatting (default: 'en-PH')
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, options = {}) {
  const {
    symbol = '₱',
    decimals = 2,
    showSymbol = true,
    locale = 'en-PH',
  } = options;

  // Handle null/undefined/empty
  if (amount === null || amount === undefined || amount === '') {
    return showSymbol ? `${symbol}0.00` : '0.00';
  }

  // Convert to number
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle NaN
  if (isNaN(num)) {
    return showSymbol ? `${symbol}0.00` : '0.00';
  }

  // Format using Intl.NumberFormat
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return showSymbol ? `${symbol}${formatted}` : formatted;
}

/**
 * Format a number with comma separators (no currency symbol)
 * @param {number|string} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
function formatNumber(amount, decimals = 2) {
  return formatCurrency(amount, { showSymbol: false, decimals });
}

/**
 * Format a number as currency with compact notation (e.g., ₱1.2K, ₱1.5M)
 * @param {number|string} amount - The amount to format
 * @param {Object} options - Formatting options
 * @returns {string} Compact formatted currency string
 */
function formatCurrencyCompact(amount, options = {}) {
  const { symbol = '₱' } = options;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return `${symbol}0`;

  const formatter = new Intl.NumberFormat('en-PH', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  });

  return `${symbol}${formatter.format(num)}`;
}

/**
 * Format a currency amount with specific decimal places
 * @param {number|string} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {string} symbol - Currency symbol (default: '₱')
 * @returns {string} Formatted currency string
 */
function formatCurrencyWithDecimals(amount, decimals = 2, symbol = '₱') {
  return formatCurrency(amount, { symbol, decimals });
}

// Export as a unified object or individual functions
module.exports = {
  formatCurrency,
  formatNumber,
  formatCurrencyCompact,
  formatCurrencyWithDecimals,
};