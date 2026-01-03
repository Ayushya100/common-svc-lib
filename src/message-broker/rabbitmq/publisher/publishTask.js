'use strict';

import Joi from 'joi';
import { getPublisher } from './index.js';

/**
 * validateArgs
 *
 * Validates input arguments required for publishing a task to a message queue.
 *
 * Ensures:
 * - A valid queue key is provided
 * - A payload exists for the task
 *
 * Throws an error when validation fails to prevent publishing invalid messages.
 *
 * @param {string} queueKey - Identifier used to select the target queue configuration.
 * @param {any} payload - Task payload data to be published.
 * @throws {Error} - Thrown when argument validation fails.
 */

function validateArgs(queueKey, payload) {
  const schema = Joi.object({
    queueKey: Joi.string().required(),
    payload: Joi.any().required(),
  });

  const { error } = schema.validate({ queueKey, payload });
  if (error) {
    throw new Error(`Publish validation failed: ${error.message}`);
  }
}

/**
 * publishTask
 *
 * High-level helper function to publish a task message to a configured message queue.
 *
 * This function:
 * - Validates input arguments
 * - Retrieves or creates a publisher instance
 * - Publishes the task with optional context metadata
 *
 * Acts as the primary public API for task publishing.
 *
 * @param {string} queueKey - Key used to resolve the queue configuration.
 * @param {any} payload - Data payload to be processed by the consumer.
 * @param {Object} [context={}] - Optional contextual metadata for tracing or debugging.
 * @returns {Promise<string>} - Resolves with the generated task ID after publishing.
 */

const publishTask = async (queueKey, payload, context = {}) => {
  validateArgs(queueKey, payload);

  const publisher = await getPublisher(queueKey);
  return publisher.publish(payload, context);
};

export default publishTask;
