'use strict';

import { performance } from 'perf_hooks';
import db from './db.js';
import { logger } from '../utils/index.js';

const log = logger('DB');

class DB {
  constructor() {}

  async execute(query, params = []) {
    try {
      log.debug(`Input Query: ${query}`);
      log.debug(`Input Params: ${params}`);
      log.info('Query execution begins');

      // Tracker Initiated
      const startMemo = process.memoryUsage().heapUsed / 1024 / 1024;
      const startTime = performance.now();

      // Knex.js implementation
      let result = await db.raw(query, params);
      log.info('Query execution completed');

      // Tracker Finalized
      const endMemo = process.memoryUsage().heapUsed / 1024 / 1024;
      const endTime = performance.now();

      log.info(
        `Query execution performance result - Memory Consumption: ${Math.abs(endMemo - startMemo).toFixed(2)} MB. Time consumption: ${Math.abs(endTime - startTime).toFixed(2)} ms`
      );

      return {
        rowCount: result.rowCount,
        rows: result.rows,
      };
    } catch (err) {
      log.error(`Error occurred while executing the query! Error: ${err}`);
      throw {
        status: 500,
        message: 'An error occurred while executing the query.',
        errors: err,
      };
    }
  }
}

export default new DB();
