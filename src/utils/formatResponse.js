'use strict';

import { convertIdToPrettyString } from './idConverter.js';
import convertToNativeTimezone from './dateTimeConvertor.js';

const applyConversion = (obj, fields, converter) => {
  fields.forEach((field) => {
    if (obj[field]) {
      obj[field] = converter(obj[field]);
    }
  });
};

const applyKeyMapping = (obj, keyMap) => {
  Object.keys(obj).forEach((key) => {
    if (keyMap[key] && keyMap[key] !== key) {
      obj[keyMap[key]] = obj[key];
      delete obj[key];
    }
  });
};

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

const _Response = (statusCode, message, data = {}) => {
  return {
    status: statusCode,
    message: message,
    data: data,
  };
};

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
