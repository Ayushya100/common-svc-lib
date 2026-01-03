'use strict';

import Redis from 'ioredis';
import { logger } from '../../utils/index.js';

const log = logger('Redis Connection');

/**
 * RedisConnection
 *
 * Manages a singleton Redis client connection with environment-based configuration and lifecycle handling.
 *
 * Responsibilities:
 * - Read Redis configuration from environment variables or options
 * - Establish and reuse a Redis client connection
 * - Handle Redis connection events (connect, ready, error, close)
 * - Gracefully close the Redis connection when required
 */

class RedisConnection {
  /**
   * Creates a new RedisConnection instance.
   *
   * Configuration priority:
   * 1. Environment variables
   * 2. Constructor options
   *
   * @param {Object} [options={}] - Optional Redis connection configuration.
   * @param {string} [options.url] - Redis connection URL.
   * @param {string} [options.host] - Redis server hostname.
   * @param {number|string} [options.port] Redis server port.
   * @param {string} [options.password] - Password for Redis authentication.
   */
  constructor(options = {}) {
    this.url = process.env.REDIS_URL || options.url;
    this.host = process.env.REDIS_HOST || options.host;
    this.port = process.env.REDIS_PORT || options.port;
    this.password = process.env.REDIS_PASSWORD || options.password;
    this.client = null;
  }

  /**
   * connect
   *
   * Establishes a Redis connection if one does not already exist. Subsequent calls return the existing client instance.
   *
   * Connection behavior:
   * - Uses Redis URL if provided
   * - Falls back to host/port configuration
   * - Throws an error if configuration is missing
   *
   * @throws {Error} - Thrown when Redis configuration is incomplete.
   * @returns {Object} - Active Redis client instance.
   */
  connect() {
    if (this.client) {
      return this.client;
    }

    const redisOptions = {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    };
    if (this.url) {
      this.client = new Redis(this.url, redisOptions);
    } else if (this.host && this.port) {
      this.client = new Redis(
        {
          host: this.host,
          port: Number(this.port),
          password: this.password,
        },
        redisOptions
      );
    } else {
      throw new Error(
        'Redis config missing. Set REDIS_URL or REDIS_HOST + REDIS_PORT.'
      );
    }

    this.client.on('connect', () => {
      log.info('[Redis] Connecting...');
    });

    this.client.on('ready', () => {
      log.info('[Redis] Connection ready');
    });

    this.client.on('error', (err) => {
      this.error(`[Redis] Connection error ${err}`);
    });

    this.client.on('close', () => {
      this.warning('[Redis] Connection closed');
    });

    return this.client;
  }

  /**
   * disconnect
   *
   * Gracefully closes the Redis connection if it exists and resets the internal client reference.
   *
   * @returns {Promise<void>} - Resolves once the connection has been closed.
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

export default RedisConnection;
