'use strict';

import { logger } from '../../utils/index.js';

const log = logger('Redis Manager');

/**
 * RetryManager
 *
 * Manages delayed retries for failed tasks using Redis sorted sets and an exponential backoff strategy.
 *
 * Responsibilities:
 * - Track retry attempts per message
 * - Calculate retry delays using exponential backoff
 * - Schedule messages for future retry execution
 * - Fetch retries that are due for processing
 * - Remove retried or completed messages from storage
 */

class RetryManager {
  /**
   * Creates a new RetryManager instance.
   *
   * @param {Object} redisClient - Redis client instance used for storing retry metadata.
   * @param {Object} [options={}] - Optional configuration object.
   * @param {string} [options.prefix='retry'] - Redis key prefix used to namespace retry queues.
   * @param {number} [options.maxRetries=5] - Maximum number of retry attempts per message.
   * @param {number} [options.baseDelayMs=5000] - Base delay (in milliseconds) used to calculate exponential backoff between retries.
   */
  constructor(redisClient, options = {}) {
    this.redis = redisClient;
    this.prefix = options.prefix || 'retry';
    this.maxRetries = options.maxRetries || 5;
    this.baseDelayMs = options.baseDelayMs || 5000;
  }

  /**
   * getKey
   *
   * Generates the Redis key for a given queue name.
   *
   * @param {string} queueName - Name of the queue.
   * @returns {string} - Namespaced Redis key for retry storage.
   */
  getKey(queueName) {
    return `${this.prefix}:${queueName}`;
  }

  /**
   * calculateDelay
   *
   * Calculates the retry delay using exponential backoff.
   *
   * Formula: delay = baseDelayMs * (2 ^ retryCount)
   *
   * @param {number} retryCount - Current retry attempt number.
   * @returns {number} - Delay in milliseconds before the next retry.
   */
  calculateDelay(retryCount) {
    return this.baseDelayMs * Math.pow(2, retryCount);
  }

  /**
   * scheduleRetry
   *
   * Schedules a message for retry execution at a future time.
   *
   * Behavior:
   * - Increments the retry count on the message
   * - Applies exponential backoff to calculate delay
   * - Stores the message in a Redis sorted set
   * - Stops scheduling if the maximum retry count is exceeded
   *
   * @param {string} queueName - Name of the queue the message belongs to.
   * @param {Object} message - Original message payload.
   * @returns {Promise<boolean>} - Returns true if the retry was scheduled; false if the maximum retry limit was exceeded.
   */
  async scheduleRetry(queueName, message) {
    const retryCount = (message._retryCount || 0) + 1;

    if (retryCount > this.maxRetries) {
      log.warning(
        `[RetryManager] Max retries exceeded for task ${message.taskId}`
      );
      return false;
    }

    const delay = this.calculateDelay(retryCount);
    const runAt = Date.now() + delay;

    const retryMessage = {
      ...message,
      _retryCount: retryCount,
      _nextRetryAt: runAt,
    };

    await this.redis.zadd(
      this.getKey(queueName),
      runAt,
      JSON.stringify(retryMessage)
    );

    return true;
  }

  /**
   * fetchDueRetries
   *
   * Retrieves messages that are due for retry execution.
   *
   * @param {string} queueName - Name of the retry queue.
   * @param {number} [limit=10] - Maximum number of messages to retrieve.
   * @returns {Promise<string[]>} - Array of serialized messages ready for retry.
   */
  async fetchDueRetries(queueName, limit = 10) {
    const now = Date.now();
    return this.redis.zrangebyscore(
      this.getKey(queueName),
      0,
      now,
      'LIMIT',
      0,
      limit
    );
  }

  /**
   * removeRetry
   *
   * Removes a message from the retry queue after it has been processed or permanently failed.
   *
   * @param {string} queueName - Name of the retry queue.
   * @param {string} serializeMessage - Serialized message string stored in Redis.
   * @returns {Promise<void>} - Resolves once the message is removed.
   */
  async removeRetry(queueName, serializeMessage) {
    await this.redis.zrem(this.getKey(queueName), serializeMessage);
  }
}

export default RetryManager;
