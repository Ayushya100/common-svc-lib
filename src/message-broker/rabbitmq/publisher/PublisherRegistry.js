'use strict';

import { QUEUES } from '../../config/index.js';
import RabbitMQConnection from '../RabbitMQConnection.js';
import { BasePublisher, TaskPublisher } from './index.js';

/**
 * registry
 *
 * In-memory cache for publisher instances. Ensures that only one publisher is created per queue key and reused across the application lifecycle.
 *
 * Key:   Queue identifier (string)
 * Value: TaskPublisher instance
 */
const registry = new Map();
const rmqConnection = new RabbitMQConnection();

/**
 * getPublisher
 *
 * Retrieves a TaskPublisher instance for the specified queue key.
 *
 * This function:
 * - Returns a cached publisher if one already exists
 * - Validates the queue configuration
 * - Establishes a RabbitMQ channel if needed
 * - Sets up exchange, queue, and bindings
 * - Creates and caches a TaskPublisher instance
 *
 * @param {string} queueKey - Key used to look up queue configuration from QUEUES.
 * @returns {Promise<TaskPublisher>} - Resolves with a TaskPublisher instance for the given queue.
 * @throws {Error} - Thrown when no queue configuration exists for the provided key.
 */

async function getPublisher(queueKey) {
  if (registry.has(queueKey)) {
    return registry.get(queueKey);
  }

  const queueConfig = QUEUES[queueKey];
  if (!queueConfig) {
    throw new Error(`Queue config not found for key: ${queueConfig}`);
  }

  const channel = await rmqConnection.connect();

  const basePublisher = new BasePublisher(channel);
  await basePublisher.setupTopology(queueConfig);

  const publisher = new TaskPublisher(channel, queueConfig);
  registry.set(queueKey, publisher);

  return publisher;
}

export default getPublisher;
