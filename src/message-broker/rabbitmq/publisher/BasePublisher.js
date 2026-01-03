'use strict';

/**
 * BasePublisher
 *
 * Base class responsible for setting up messaging infrastructure (exchanges, queues, bindings) using a provided message broker channel.
 *
 * This class is intended to be extended by specific publishers that publish messages to configured queues.
 */

class BasePublisher {
  /**
   * Creates an instance of BasePublisher.
   *
   * @param {Object} channel - Messaging channel instance used to assert exchanges, queues, and bindings.
   */
  constructor(channel) {
    this.channel = channel;
  }

  /**
   * setupTopology
   *
   * Sets up the messaging topology by creating:
   * - An exchange
   * - A durable queue
   * - A dead letter queue (DLQ)
   * - A binding between the queue and exchange (if routing key exists)
   *
   * @param {Object} config - Configuration object for queue topology.
   * @param {string} config.exchange - Name of the exchange.
   * @param {string} config.type - Type of the exchange (e.g., direct, topic).
   * @param {string} config.queue - Name of the main queue.
   * @param {string} [config.routingKey] - Optional routing key used to bind the queue to the exchange.
   * @param {string} config.dlq - Name of the dead letter queue for failed messages.
   * @returns {Promise<void>} - Resolves when the topology is successfully created.
   */
  async setupTopology({ exchange, type, queue, routingKey, dlq }) {
    await this.channel.assertExchange(exchange, type, { durable: true });

    await this.channel.assertQueue(queue, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: dlq,
    });

    await this.channel.assertQueue(dlq, { durable: true });

    if (routingKey) {
      await this.channel.bindQueue(queue, exchange, routingKey);
    }
  }
}

export default BasePublisher;
