'use strict';

/**
 * RabbitMQConfig
 *
 * Utility class responsible for providing RabbitMQ connection configuration values.
 *
 * Reads required settings from environment variables and ensures safe defaults and validation.
 */

class RabbitMQConfig {
  /**
   * getUrl
   *
   * Retrieves the RabbitMQ connection URL from environment variables.
   *
   * Throws an error if the URL is not configured.
   *
   * @throws {Error} - If the RABBITMQ_URL environment variable is missing.
   * @returns {string} - Trimmed RabbitMQ connection URL.
   */
  static getUrl() {
    const url = process.env.RABBITMQ_URL;

    if (!url) {
      throw new Error(
        'RabbitMQ URL not configured. Set RABBITMQ_URL environment variable.'
      );
    }

    return url.trim();
  }

  /**
   * getOptions
   *
   * Builds and returns RabbitMQ connection options using environment variables with fallback defaults.
   *
   * @returns {Object} - RabbitMQ connection configuration options.
   * @property {number} heartbeat - Interval (in seconds) used to keep the connection alive.
   * @property {number} connectionTimeout - Maximum time (in milliseconds) to wait for a connection.
   */
  static getOptions() {
    return {
      heartbeat: Number(process.env.RABBITMQ_HEARTBEAT || 30), // Detect dead connections within ~60s
      connectionTimeout: Number(process.env.RABBITMQ_CONN_TIMEOUT || 10000), // Fail connection attempts after 10s
    };
  }
}

export default RabbitMQConfig;
