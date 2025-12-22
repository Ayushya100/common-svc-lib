'use strict';

import { responseCodes, responseMessage } from '../assets/response-codes.js';
import { translate } from './i18n.js';

/*
 * ApiResponse class to handle all the responses
 * @param {number}
 * @param {string}
 * @param {string}
 * @param {string}
 * @param {array[object]}
 * @returns {} - returns nothing.
 */

class ApiResponse {
  constructor(
    status,
    type,
    message = 'Success',
    devMessage = 'Success',
    data = []
  ) {
    this.status = status;
    this.type = type;
    this.message = message;
    this.devMessage = devMessage;
    this.data = data;
    this.success = status < 400;
  }
}

const ResponseBuilder = (res) => {
  res.message = translate(res.message);

  const apiResponse = new ApiResponse(
    res.status || 500,
    responseCodes[res.status],
    res.message,
    responseMessage[res.status],
    res.data || []
  );

  return apiResponse;
};

export default ResponseBuilder;
