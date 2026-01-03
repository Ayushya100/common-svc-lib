'use strict';

import { db } from './index.js';

/**
 * CoreDB
 *
 * Core database access layer responsible for executing low-level database operations related to core entities.
 *
 * @class CoreDB
 */

class CoreDB {
  constructor() {
    // Initializes CoreDB table mappings.
    this.tables = {
      USER_METADATA: 'USER_METADATA',
    };
  }

  /**
   * Retrieves the refresh token for a given user.
   *
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserRefreshToken(userId) {
    const query = `SELECT REFRESH_TOKEN FROM ${this.tables['USER_METADATA']}
      WHERE USER_ID = ?;`;
    const params = [userId];
    return await db.execute(query, params);
  }
}

export default new CoreDB();
