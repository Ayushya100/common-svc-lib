'use strict';

/**
 * convertToNativeTimezone
 *
 * Converts a datetime into a human-readable string based on the system's local timezone.
 *
 * @param {string | number | Date} datetime - Input datetime value (ISO string, timestamp, or Date object).
 * @returns {string} - Formatted datetime string in `YYYY-MM-DD HH:mm:ss` format.
 */

const convertToNativeTimezone = (datetime) => {
  const date = new Date(datetime);

  const format =
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0') +
    ' ' +
    String(date.getHours()).padStart(2, '0') +
    ':' +
    String(date.getMinutes()).padStart(2, '0') +
    ':' +
    String(date.getSeconds()).padStart(2, '0');
  return format;
};

export default convertToNativeTimezone;
