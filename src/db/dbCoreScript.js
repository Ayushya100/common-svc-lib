'use strict';

import { db } from './index.js';

class CoreDB {
  constructor() {
    this.tables = {
      USER_METADATA: 'USER_METADATA',
    };
  }

  async getUserRefreshToken(userId) {
    const query = `SELECT REFRESH_TOKEN FROM ${this.tables['USER_METADATA']}
      WHERE USER_ID = ?;`;
    const params = [userId];
    return await db.execute(query, params);
  }
}

export default new CoreDB();
