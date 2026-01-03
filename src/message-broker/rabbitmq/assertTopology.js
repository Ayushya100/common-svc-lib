'use strict';

import { logger } from '../../utils/index.js';

const log = logger('queue-topology');

/**
 * Asserts and configures the RabbitMQ messaging topology.
 *
 * This function ensures that the exchange, main queue, and dead-letter queue (DLQ)
 * exist and are properly bound. It creates durable resources and applies
 * dead-lettering configuration to the main queue before binding it to the exchange.
 *
 * @function assertTopology
 *
 * @param {Object} channel - An active RabbitMQ channel instance used to perform topology assertions.
 * @param {Object} config - Configuration object defining the messaging topology.
 * @param {string} config.exchange - Name of the exchange to assert.
 * @param {string} config.type - Type of the exchange (e.g., 'direct', 'topic', 'fanout').
 * @param {string} config.queue - Name of the primary queue to assert.
 * @param {string} config.routingKey - Routing key used to bind the queue to the exchange.
 * @param {string} config.dlq - Name of the dead-letter queue for failed or rejected messages.
 *
 * @returns {Promise<void>} - Asserts exchange and queues, applies bindings, and logs each setup step.
 *
 * @throws {Error} - Thrown if exchange/queue assertion or queue binding fails.
 */

const assertTopology = async (channel, config) => {
  const { queue, exchange, type, routingKey, dlq } = config;

  log.info('Set Exchange initiated');
  await channel.assertExchange(exchange, type, { durable: true });

  log.info('Set Dead-letter queue initiated');
  await channel.assertQueue(dlq, { durable: true });

  log.info('Set Main queue initiated');
  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: '',
    deadLetterRoutingKey: dlq,
  });

  log.info('Queue Binding initiated');
  await channel.bindQueue(queue, exchange, routingKey);
  log.info('Pre-Bindings completed');
};

export default assertTopology;
