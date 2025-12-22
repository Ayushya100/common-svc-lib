'use strict';

import { responseCodes, responseMessage } from '../assets/response-codes.js';
import { translate } from './i18n.js';

/*
 * ApiError class to handle all the errors.
 * @param {number}
 * @param {string}
 * @param {string}
 * @param {string}
 * @param {array}
 * @param {string}
 * @param {array[object]}
 * @return {} - returns nothing.
 */

class ApiError extends Error {
  constructor(
    status,
    message = 'An error occurred while processing the request.',
    devMessage = 'An Internal Server Error occurred while processing the request.',
    type = 'INTERNAL_SERVER_ERROR',
    errors = [],
    stack = '',
    data = []
  ) {
    (super(message), (this.status = status));
    this.message = message;
    this.devMessage = devMessage;
    this.type = type;
    this.errors = errors;
    this.data = data;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    this.success = status < 400;
  }
}

/*
 * Builds the error object.
 * @param {object} err - the error object.
 * @returns {object} - returns the error object.
 */

const ErrorBuilder = (err) => {
  const errors = err.errors || [];
  const stack = errors && errors.stack ? errors.stack : '';
  err.message = translate(err.message);

  const apiError = new ApiError(
    err.status || 500,
    err.message,
    responseMessage[err.status],
    responseCodes[err.status],
    errors,
    stack,
    err.data
  );

  return apiError;
};

export default ErrorBuilder;
