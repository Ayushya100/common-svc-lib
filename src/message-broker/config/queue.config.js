'use strict';

/**
 * QUEUES
 *
 * Centralized configuration object for message queues used in the application.
 *
 * Defines queue names, exchanges, routing types, routing keys, and dead-letter queues (DLQ)
 * for messaging infrastructure (e.g., RabbitMQ).
 *
 * @property {Object} EMAIL_TASKS - Configuration for email-related background tasks.
 * @property {string} EMAIL_TASKS.queue - Primary queue name used to process email tasks.
 * @property {string} EMAIL_TASKS.exchange - Exchange responsible for routing email messages.
 * @property {string} EMAIL_TASKS.type - Exchange type used for message routing (e.g., direct).
 * @property {string} EMAIL_TASKS.routingKey - Routing key used to bind messages to the queue.
 * @property {string} EMAIL_TASKS.dlq - Dead-letter queue name for failed or rejected messages.
 */

export const QUEUES = {
  EMAIL_TASKS: {
    queue: 'email.tasks',
    exchange: 'email.exchange',
    type: 'direct',
    routingKey: 'email.send',
    dlq: 'email.tasks.dlq',
  },
};
