'use strict';

import { randomUUID } from 'crypto';

/**
 * correlationMiddleware to generate, attach, and propagate a correlation ID for tracking requests across services and logs.
 *
 * @function correlationMiddleware
 *
 * @param {Object} req - Express request object.
 *   - Reads `x-correlation-id` from request headers if present.
 *   - Attaches `correlationId` to the request object.
 *
 * @param {Object} res - Express response object.
 *   - Sets `x-correlation-id` header on the response.
 *
 * @param {Function} next - Express next middleware function.
 * @returns {void} - Adds a correlation ID to the request/response lifecycle and passes control to the next middleware.
 */

const correlationMiddleware = async (req, res, next) => {
  let correlationId = req.headers['x-correlation-id'];
  if (!correlationId) {
    correlationId = randomUUID();
    req.headers['x-correlation-id'] = correlationId;
  }

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
};

export default correlationMiddleware;
