'use strict';

import { ErrorBuilder } from '../utils/index.js';

/**
 * errorHandler middleware to handle and normalize API errors
 *
 * @function errorHandler
 *
 * @param {Error|Object} err - The error object thrown by the application or middleware.
 *   Can include:
 *   - status {number}
 *   - errors {string | Error | Array<{ message: string }> | any}
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void} - Sends a formatted JSON error response with HTTP status code.
 */

const errorHandler = (err, req, res, next) => {
  const apiError = ErrorBuilder(err);

  let errors = [];
  if (Array.isArray(apiError.errors)) {
    errors = apiError.errors.map((e) => e?.message || e);
  } else if (apiError.errors instanceof Error) {
    errors = [apiError.errors.message];
  } else if (typeof apiError.errors === 'string') {
    errors = [apiError.errors];
  } else if (apiError.errors) {
    errors = [apiError.errors];
  }
  apiError.errors = errors;

  res.status(err.status).json(apiError);
};

export default errorHandler;
