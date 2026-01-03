'use strict';

import { randomUUID } from 'crypto';

/**
 * sessionMiddleware to generate, attach, and propagate a session ID for identifying and tracking user sessions across requests.
 *
 * @function sessionMiddleware
 *
 * @param {Object} req - Express request object.
 *   - Reads `x-session-id` from request headers if present.
 *   - Attaches `sessionId` to the request object.
 *
 * @param {Object} res - Express response object.
 *   - Sets `x-session-id` header on the response.
 * @param {Function} next - Express next middleware function.
 * @returns {void} - Adds a session ID to the request/response lifecycle and passes control to the next middleware.
 */

const sessionMiddleware = async (req, res, next) => {
  let sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    sessionId = randomUUID();
    req.headers['x-session-id'] = sessionId;
  }

  req.sessionId = sessionId;
  res.setHeader('x-session-id', sessionId);
  next();
};

export default sessionMiddleware;
