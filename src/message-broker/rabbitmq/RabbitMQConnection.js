'use strict';

import amqp from 'amqplib';
import { RabbitMQConfig } from '../config/index.js';
import { logger } from '../../utils/index.js';

const log = logger('RabbitMQ Connection');

/**
 * RabbitMQConnection
 *
 * Manages the lifecycle of a RabbitMQ connection and channel within the application.
 *
 * Ensures a single active connection and channel, provides automatic reuse, and handles connection events and graceful shutdown.
 */

class RabbitMQConnection {
  /**
   * constructor
   *
   * Initializes the RabbitMQ connection manager with no active connection or channel.
   */
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  /**
   * connect
   *
   * Establishes a connection to RabbitMQ and creates a channel if one does not already exist.
   *
   * Reuses the existing channel when available to prevent multiple connections.
   *
   * @async
   * @returns {Promise<Object>} - Active RabbitMQ channel instance.
   * @throws {Error} - If connection or channel creation fails.
   */
  async connect() {
    if (this.channel) {
      return this.channel;
    }

    const url = RabbitMQConfig.getUrl();
    const options = RabbitMQConfig.getOptions();

    try {
      log.info('[RabbitMQ] Connecting...');
      log.info(`Connecting URL: ${url}`);
      log.info(`Options Provided: ${JSON.stringify(options)}`);

      this.connection = await amqp.connect(url, options);
      log.info('[RabbitMQ] Connection build');

      this.connection.on('error', (err) => {
        log.error(`[RabbitMQ] Connection error ${err}`);
      });

      this.connection.on('close', () => {
        log.warning('[RabbitMQ] Connection closed');
        this.connection = null;
        this.channel = null;
      });

      this.channel = await this.connection.createChannel();
      log.info('[RabbitMQ] Channel created');

      return this.channel;
    } catch (err) {
      log.error(`[RabbitMQ] Failed to connect --> ${err}`);
      throw err;
    }
  }

  /**
   * close
   *
   * Gracefully closes the RabbitMQ channel and connection if they exist.
   *
   * Ensures resources are properly released during application shutdown.
   *
   * @async
   * @throws {Error} - If an error occurs while closing the connection.
   */
  async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      log.info('[RabbitMQ] Connection closed cleanly');
    } catch (err) {
      log.error(`[RabbitMQ] Error during shutdown --> ${err}`);
      throw err;
    }
  }
}

export default RabbitMQConnection;
