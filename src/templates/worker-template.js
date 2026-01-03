'use strict';

import { logger } from '../utils/index.js';
import {
  publishTask,
  RedisConnection,
  RetryManager,
  startConsumer,
} from '../message-broker/index.js';

const log = logger('worker-configuration');

/**
 * Worker class responsible for consuming tasks from a queue, routing them to registered handlers, and managing retries.
 *
 * @class Worker
 *
 * @param {string} workerName - Human-readable name of the worker instance.
 * @param {string} queueKey - Queue identifier used for task consumption and retry management.
 * @property {string} name - Name of the worker.
 * @property {string} queueKey - Queue key associated with the worker.
 * @property {Object} redisConnection - Redis connection instance.
 * @property {Object} redisClient - Connected Redis client.
 * @property {RetryManager} retryManager - Manages retry scheduling and polling.
 * @property {Map<string, Function>} handlers - Map of action names to their respective handler functions.
 */

class Worker {
  constructor(workerName, queueKey) {
    log.debug('Worker constructor has been called');

    this.name = workerName;
    this.queueKey = queueKey;

    this.redisConnection = new RedisConnection();
    this.redisClient = this.redisConnection.connect();
    this.retryManager = new RetryManager(this.redisClient, {
      maxRetries: process.env.MAX_RETRIES,
    });

    // Map to store multiple handlers
    this.handlers = new Map();

    this.setupProcessHandler();
  }
}

/**
 * Sets up process-level handlers to gracefully shut down the worker on fatal errors or termination signals.
 *
 * @function setupProcessHandler
 *
 * @memberof Worker.prototype
 *
 * @returns {void}
 *   Registers listeners for uncaught exceptions, unhandled promise rejections, and OS termination signals.
 */

Worker.prototype.setupProcessHandler = function () {
  process.on('uncaughtException', shutdown);
  process.on('unhandledRejection', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  function shutdown(reason) {
    log.error('Shutting down worker...');
    log.error(`Shutdown Reason: ${reason}`);
    process.exit(1);
  }
};

/**
 * Registers a handler function for a specific action.
 *
 * @function registerHandler
 *
 * @memberof Worker.prototype
 *
 * @param {string} action - Action name used to route incoming tasks.
 * @param {Function} handler - Function responsible for processing tasks of the given action.
 * @returns {void} - Binds and stores the handler in the internal handler map.
 */

Worker.prototype.registerHandler = function (action, handler) {
  this.handlers.set(action, handler.bind(this));
  log.info(`Registered handler for action: ${action}`);
};

/**
 * Wraps task execution with routing, logging, and retry handling.
 *
 * @function _messageWrapper
 *
 * @memberof Worker.prototype
 *
 * @param {Object} data - Task payload received from the queue.
 * @param {string} data.taskId - Unique identifier for the task.
 * @param {Object} data.payload - Actual task payload.
 * @param {Object} [data.context] - Optional task metadata.
 * @returns {Promise<void>} - Executes the appropriate handler or schedules a retry on failure.
 * @throws {Error} - Rethrows handler errors after retry scheduling.
 */

Worker.prototype._messageWrapper = async function (data) {
  try {
    const action = data.context?.action || 'default';
    const handler = this.handlers.get(action);

    if (!handler) {
      throw new Error(`No handler registered for action: ${action}`);
    }

    log.info(`Routing Task [${data.taskId}] to [${action}] handler`);
    await handler(data);
  } catch (err) {
    log.error(`[Worker] Task [${data.taskId}] Failed: ${err.message}`);
    const scheduled = await this.retryManager.scheduleRetry(
      this.queueKey,
      data
    );
    if (scheduled) {
      log.info(`[Worker] Task ${data.taskId} moved to Redis for retry...`);
    }
    throw err;
  }
};

/**
 * Starts a polling loop to fetch and requeue tasks whose retry delay has elapsed.
 *
 * @function startRetryPoller
 *
 * @memberof Worker.prototype
 *
 * @returns {void} - Periodically polls Redis for due retry tasks and republishes them to the queue.
 */

Worker.prototype.startRetryPoller = function () {
  setInterval(async () => {
    try {
      const dueTasks = await this.retryManager.fetchDueRetries(this.queueKey);
      for (const serializedTask of dueTasks) {
        log.info('Due Tasks retry initiated');
        const task = JSON.parse(serializedTask);
        await publishTask(this.queueKey, task.payload, task.context);
        await this.retryManager.removeRetry(this.queueKey, serializedTask);
      }
    } catch (err) {
      log.error(`Poller Error: ${err.message}`);
    }
  }, 1000);
};

/**
 * Starts the worker by initializing the queue consumer and retry poller.
 *
 * @function start
 *
 * @memberof Worker.prototype
 *
 * @param {Object} [options] - Consumer configuration options.
 * @param {number} [options.prefetch=2] - Number of messages to prefetch from the queue.
 * @returns {Promise<void>} - Starts consuming tasks and logs worker readiness.
 * @throws {Error} - Terminates the process if startup fails.
 */

Worker.prototype.start = async function (options = { prefetch: 2 }) {
  try {
    await startConsumer(
      this.queueKey,
      this._messageWrapper.bind(this),
      options
    );
    this.startRetryPoller();
    log.info(`${this.name} Service Online`);
  } catch (err) {
    log.error(`Worker Startup Failed: ${err.message}`);
    process.exit(1);
  }
};

export default Worker;
