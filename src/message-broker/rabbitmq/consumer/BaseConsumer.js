'use strict';

import { logger } from '../../../utils/index.js';

const log = logger('Consumer');

/**
 * BaseConsumer
 *
 * A base RabbitMQ consumer wrapper that handles channel setup, message consumption, acknowledgements, and error handling.
 *
 * Responsibilities:
 * - Configure channel prefetch count
 * - Listen for channel-level errors and closures
 * - Consume messages from a queue
 * - Safely parse and process messages
 * - Acknowledge or reject messages based on processing outcome
 */

class BaseConsumer {
  /**
   * Creates a new BaseConsumer instance.
   *
   * @param {Object} channel - RabbitMQ channel instance used for consuming messages.
   * @param {Object} [options={}] - Optional configuration object.
   * @param {number} [options.prefetch=5] - Maximum number of unacknowledged messages the consumer can process at a time.
   */
  constructor(channel, options = {}) {
    this.channel = channel;
    this.prefetch = options.prefetch ?? 5;

    this.channel.prefetch(this.prefetch);

    this.channel.on('error', (err) => {
      log.error(`[RabbitMQ] Channel error, ${err}`);
    });
    this.channel.on('close', () => {
      log.warning('[RabbitMQ] Channel closed');
    });
  }

  /**
   * consume
   *
   * Starts consuming messages from the specified queue. Each message is parsed as JSON and passed to the provided message handler.
   *
   * Message handling behavior:
   * - Acknowledges the message on successful processing
   * - Rejects the message (without requeue) on failure, allowing it to be routed to a Dead Letter Queue (DLQ)
   *
   * @param {string} queueName - Name of the RabbitMQ queue to consume from.
   * @param {Function} onMessage - Async callback function invoked for each message.
   * @param {Object} onMessage.content - Parsed JSON content of the message.
   * @param {Object} onMessage.headers - Message headers provided by RabbitMQ.
   * @returns {Promise<void>} - Resolves once the consumer is successfully registered.
   */
  async consume(queueName, onMessage) {
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await onMessage(content, msg.properties.headers);
        this.channel.ack(msg);
      } catch (err) {
        log.error(`[RabbitMQ] Processing failed, ${err}`);
        this.channel.nack(msg, false, false); // DLQ
      }
    });
  }
}

export default BaseConsumer;
