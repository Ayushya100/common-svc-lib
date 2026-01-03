'use strict';

import { randomUUID, createHmac } from 'crypto';

/**
 * TaskPublisher
 *
 * Publisher class responsible for creating, signing, and publishing task messages to a message queue exchange.
 *
 * Each message is:
 * - Assigned a unique task ID
 * - Signed using an HMAC signature for integrity verification
 * - Published as a persistent JSON message
 *
 * This class abstracts message construction and publishing logic for asynchronous task processing.
 */

class TaskPublisher {
  /**
   * Creates an instance of TaskPublisher.
   *
   * @param {Object} channel -  Messaging channel instance used to publish messages.
   * @param {Object} queueConfig - Queue configuration object containing exchange and routing details.
   * @param {string} queueConfig.exchange - Name of the exchange to publish messages to.
   * @param {string} [queueConfig.routingKey] - Optional routing key for message delivery.
   */
  constructor(channel, queueConfig) {
    this.channel = channel;
    this.queueConfig = queueConfig;
    this.secret = process.env.MESSAGE_SIGNING_SECRET;
  }

  /**
   * signMessage
   *
   * Generates a cryptographic signature for a message payload.
   *
   * The signature can be used by consumers to verify message authenticity and integrity.
   *
   * @param {Object} message - Message object to be signed.
   * @returns {string} - Hex-encoded HMAC signature of the message.
   */
  signMessage(message) {
    return createHmac('sha256', this.secret)
      .update(JSON.stringify(message))
      .digest('hex');
  }

  /**
   * publish
   *
   * Creates a task message, signs it, and publishes it to the configured message exchange.
   *
   * The published message includes:
   * - A unique task identifier
   * - Task payload data
   * - Optional contextual metadata
   * - Creation timestamp
   *
   * @param {any} data - Payload data to be processed by the consumer.
   * @param {Object} [context={}] - Optional contextual metadata for tracing or debugging.
   * @returns {Promise<string>} - Resolves with the generated task ID after successful publish.
   */
  async publish(data, context = {}) {
    const message = {
      taskId: randomUUID(),
      payload: data,
      _ctx: context,
      createdAt: new Date().toISOString(),
    };
    const signature = this.signMessage(message);

    this.channel.publish(
      this.queueConfig.exchange,
      this.queueConfig.routingKey || '',
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        contentType: 'application/json',
        headers: {
          'x-message-signature': signature,
          'x-producer': process.env.SERVICE_NAME,
        },
      }
    );

    return message.taskId;
  }
}

export default TaskPublisher;
