'use strict';

import morgan from 'morgan';
import { logger } from '../utils/index.js';

const log = logger('middleware: infoLogger');

/**
 * Stream object used by morgan to forward log messages
 *
 * @typedef {Object} MorganStream
 * @property {(message: string) => void} write - Writes a formatted log message.
 * @returns {void} - Does not return anything.
 */

const stream = {
  write: (message) => {
    log.info(message.trim());
  },
};

/**
 * infoLogger middleware for HTTP request logging
 *
 * Uses morgan to Log request details such as method, URL, status, response time, referrer, and user agent.
 *
 * @type {Function}
 * @returns {void}
 */

const infoLogger = morgan(
  ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms ":referrer" ":user-agent"',
  { stream }
);

export default infoLogger;
