'use strict';

import dotenv from 'dotenv';

import { Service } from './src/templates/index.js';
import { db } from './src/db/index.js';
import { infoLogger } from './src/middlewares/index.js';
import {
  logger,
  translate,
  ResponseBuilder
} from './src/utils/index.js';

dotenv.config({
  path: './env'
});

export {
  Service,
  db,
  logger,
  translate,
  ResponseBuilder
};
