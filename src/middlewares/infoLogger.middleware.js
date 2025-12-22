'use strict';

import morgan from 'morgan';
import { logger } from '../utils/index.js';

const log = logger('middleware: infoLogger');

const stream = {
  write: (message) => {
    log.info(message.trim());
  },
};

const infoLogger = morgan(
  ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms ":referrer" ":user-agent"',
  { stream }
);

export default infoLogger;
