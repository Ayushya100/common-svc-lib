'use strict';

import dotenv from 'dotenv';

import { Service } from './src/templates/index.js';
import { db, DBQuery } from './src/db/index.js';
import { infoLogger } from './src/middlewares/index.js';
import {
  logger,
  translate,
  ResponseBuilder,
  convertIdToPrettyString,
  convertPrettyStringToId,
  convertToNativeTimezone,
  formatResponseBody,
  _Response,
  _Error
} from './src/utils/index.js';

dotenv.config({
  path: './env'
});

export {
  Service,
  db,
  logger,
  translate,
  ResponseBuilder,
  convertIdToPrettyString,
  convertPrettyStringToId,
  convertToNativeTimezone,
  formatResponseBody,
  _Response,
  _Error,
  DBQuery
};
