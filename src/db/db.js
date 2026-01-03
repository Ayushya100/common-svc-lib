'use strict';

import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config({
  path: './env',
});

/**
 * db
 *
 * Knex database client instance used to manage database connections and execute queries.
 *
 * Configuration is loaded from environment variables.
 *
 * @constant db
 *
 * @type {Object} - Knex client instance.
 */

/**
 * @typedef {Object} DatabaseConnectionConfig
 *
 * @property {string} host - Database host address.
 * @property {number|string} port - Database port.
 * @property {string} user - Database username.
 * @property {string} password - Database user password.
 * @property {string} database - Database name.
 */

const db = knex({
  client: process.env.DB_CLIENT,
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 2,
    max: 10,
  },
});

export default db;
