'use strict';

import RabbitMQConnection from '../RabbitMQConnection.js';
import { SecureConsumer } from './index.js';
import { QUEUES } from '../../config/queue.config.js';
import { logger } from '../../../utils/index.js';
import assertTopology from '../assertTopology.js';

const log = logger('Consumer');

/**
 * Initializes and starts a RabbitMQ consumer for a given queue.
 *
 * @function startConsumer
 *
 * @param {string} queueKey - Key used to resolve queue configuration from the QUEUES map.
 * @param {Function} handler - Message handler function invoked for each consumed message. Receives the message payload and is responsible for processing it.
 * @param {Object} [options={}] - Optional consumer configuration.
 * @param {number} [options.prefetch] - Number of messages to prefetch for the consumer. Defaults to the consumer implementation’s internal setting.
 * @returns {Promise<void>} - Establishes a RabbitMQ connection, starts consuming messages, and logs consumer readiness.
 * @throws {Error} - Thrown when the queue configuration cannot be resolved or when the consumer fails to initialize.
 */

const startConsumer = async (queueKey, handler, options = {}) => {
  const queueConfig = QUEUES[queueKey];
  if (!queueConfig) {
    throw new Error(`Queue config not found for ${queueKey}`);
  }

  const rmq = new RabbitMQConnection();
  const channel = await rmq.connect();

  await assertTopology(channel, queueConfig);

  const consumer = new SecureConsumer(channel, {
    prefetch: options.prefetch,
  });
  await consumer.consume(queueConfig.queue, handler);

  log.info(
    `[Consumer] Started for queue ${queueConfig.queue} with prefetch ${options.prefetch ?? 5}`
  );
};

export default startConsumer;
