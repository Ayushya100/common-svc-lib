'use strict';

import { convertIdToPrettyString } from './idConverter.js';
import convertToNativeTimezone from './dateTimeConvertor.js';

/**
 * applyConversion
 *
 * @param {Object} obj
 * @param {string[]} fields
 * @param {Function} converter
 * @returns {void}
 */

const applyConversion = (obj, fields, converter) => {
  fields.forEach((field) => {
    if (obj[field]) {
      obj[field] = converter(obj[field]);
    }
  });
};

/**
 * applyKeyMapping
 *
 * @param {Object} obj
 * @param {Object<string, string>} keyMap
 * @returns {void}
 */

const applyKeyMapping = (obj, keyMap) => {
  Object.keys(obj).forEach((key) => {
    if (keyMap[key] && keyMap[key] !== key) {
      obj[keyMap[key]] = obj[key];
      delete obj[key];
    }
  });
};

/**
 * formatResponseBody
 *
 * Formats an array of response objects by:
 * - Converting identifier fields
 * - Formatting date fields
 * - Mapping object keys to API-friendly names
 *
 * @function formatResponseBody
 *
 * @param {Object[]} resArr - Array of response objects to be formatted.
 * @param {Object<string, string>} [keyMap=[]] - Optional key mapping for renaming response fields.
 * @param {string[]} [idConvertorArr=[]] - List of fields that require ID conversion.
 * @param {string[]} [dateConvertorArr=[]] - List of fields that require date formatting.
 * @returns {void} - Mutates each object in the response array in place.
 */

const formatResponseBody = (
  resArr,
  keyMap = [],
  idConvertorArr = [],
  dateConvertorArr = []
) => {
  idConvertorArr.push('id');
  dateConvertorArr.push('created_date');
  dateConvertorArr.push('modified_date');

  resArr = resArr.map((resBody) => {
    applyConversion(resBody, idConvertorArr, convertIdToPrettyString);
    applyConversion(resBody, dateConvertorArr, convertToNativeTimezone);
    applyKeyMapping(resBody, keyMap);
    return resBody;
  });
};

/**
 * _Response
 *
 * @param {number} statusCode
 * @param {string} message
 * @param {Object} [data={}]
 * @returns {Object}
 */

const _Response = (statusCode, message, data = {}) => {
  return {
    status: statusCode,
    message: message,
    data: data,
  };
};

/**
 * _Error
 *
 * @param {number} statusCode
 * @param {string} message
 * @param {Object | Error | Array | string} [errors={}]
 * @returns {Error}
 */

const _Error = (statusCode, message, errors = {}) => {
  if (errors?.status) {
    return errors;
  }

  const error = new Error(message);
  error.status = statusCode;
  error.errors = errors;
  return error;
};

export { formatResponseBody, _Response, _Error };
