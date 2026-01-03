'use strict';

import { createHmac } from 'crypto';
import { BaseConsumer } from './index.js';

/**
 * SecureConsumer
 *
 * An extension of BaseConsumer that adds message authenticity verification using HMAC signatures.
 *
 * Responsibilities:
 * - Inherit standard RabbitMQ consumption behavior
 * - Verify message integrity using a shared secret
 * - Reject messages with invalid or missing signatures
 * - Forward only verified messages to the handler
 */

class SecureConsumer extends BaseConsumer {
  /**
   * Creates a new SecureConsumer instance.
   *
   * @param {Object} channel - RabbitMQ channel instance used for consuming messages.
   *
   * @param {Object} [options={}] - Optional configuration object passed to BaseConsumer.
   *
   * Environment Variables:
   * - MESSAGE_SIGNING_SECRET
   *   Secret key used to validate message signatures.
   */
  constructor(channel, options = {}) {
    super(channel, options);
    this.secret = process.env.MESSAGE_SIGNING_SECRET;
  }

  /**
   * verifySignature
   *
   * Verifies the integrity and authenticity of a message by comparing its HMAC signature against the value provided in the message headers.
   *
   * @param {Object} message - Parsed message payload.
   * @param {Object} headers - Message headers received from RabbitMQ.
   * @returns {boolean} - Returns true if the message signature is valid; otherwise, false.
   */
  verifySignature(message, headers) {
    const expected = createHmac('sha256', this.secret)
      .update(JSON.stringify(message))
      .digest('hex');

    return headers?.['x-message-signature'] === expected;
  }

  /**
   * consume
   *
   * Starts consuming messages from the specified queue with additional security checks.
   *
   * Processing behavior:
   * - Validates the message signature before processing
   * - Rejects messages with invalid signatures
   * - Passes only verified and normalized data to the provided handler
   *
   * @param {string} queueName -  Name of the RabbitMQ queue to consume from.
   * @param {Function} handler - Async function invoked for each verified message.
   * @param {Object} handler.data - Normalized message object.
   * @param {string} handler.data.taskId - Unique identifier for the task.
   * @param {Object} handler.data.payload - Task-specific payload.
   * @param {Object} handler.data.context - Execution context metadata.
   * @param {string} handler.data.createdAt - Message creation timestamp.
   * @returns {Promise<void>} - Resolves once the consumer is successfully registered.
   */
  async consume(queueName, handler) {
    return super.consume(queueName, async (message, headers) => {
      if (!this.verifySignature(message, headers)) {
        throw new Error('Invalid message signature');
      }

      await handler({
        taskId: message.taskId,
        payload: message.payload,
        context: message._ctx,
        createdAt: message.createdAt,
      });
    });
  }
}

export default SecureConsumer;
