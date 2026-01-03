'use strict';

import { RequestContext } from '../utils/index.js';

/**
 * requestContextMiddleware
 *
 * Initializes request-scoped context and sets locale information for downstream handlers and services.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {void} - Continues request processing after initializing context.
 */

const requestContextMiddleware = (req, res, next) => {
  const userData = {
    locale: req.headers['x-lang'] || 'en-US',
  };

  RequestContext.run(userData, () => {
    next();
  });
};

export default requestContextMiddleware;
