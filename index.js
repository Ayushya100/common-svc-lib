'use strict';

import dotenv from 'dotenv';

import { Service, Worker } from './src/templates/index.js';
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
import { publishTask, startConsumer, RedisConnection, RetryManager, SecureConsumer, QUEUES, RabbitMQConnection } from './src/message-broker/index.js';

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
  DBQuery,
  publishTask,
  startConsumer,
  RedisConnection,
  RetryManager,
  SecureConsumer,
  QUEUES,
  RabbitMQConnection,
  Worker
};
