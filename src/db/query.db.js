'use strict';

import {
  _Error,
  convertPrettyStringToId,
  RequestContext,
} from '../utils/index.js';

class DBQuery {
  constructor() {
    this.tables = {
      SVC_CONFIG: 'SVC_CONFIG',
      PATH_CONFIG: 'PATH_CONFIG',
      USER_ROLE: 'USER_ROLE',
      USER_SCOPE: 'USER_SCOPE',
      ROLE_SCOPE: 'ROLE_SCOPE',
      USERS: 'USERS',
      USER_METADATA: 'USER_METADATA',
      OPERATION_TAGS: 'OPERATION_TAGS',
      GLOBAL_OPERATION_TAGS: 'GLOBAL_OPERATION_TAGS',
      USER_GLOBAL_OPERATION_TAGS: 'USER_GLOBAL_OPERATION_TAGS',
      CATEGORIES: 'CATEGORIES',
      GLOBAL_CATEGORIES: 'GLOBAL_CATEGORIES',
      USER_GLOBAL_CATEOGRIES: 'USER_GLOBAL_CATEOGRIES',
      TXN_ACCOUNTS: 'TXN_ACCOUNTS',
      TXN_CARDS: 'TXN_CARDS',
      WALLET: 'WALLET',
      MERCHANT: 'MERCHANT',
      PAYMENT_METHODS: 'PAYMENT_METHODS',
      TXN_TRANSACTIONS: 'TXN_TRANSACTIONS',
      TRANSACTION_PARTIES: 'TRANSACTION_PARTIES',
      TXN_ENTRIES: 'TXN_ENTRIES',
      RECURRING_TRANSACTIONS: 'RECURRING_TRANSACTIONS',
      RECURRING_TRANSACTION_RUNS: 'RECURRING_TRANSACTION_RUNS',
      EMI_ACCOUNTS: 'EMI_ACCOUNTS',
      EMI_SCHEDULES: 'EMI_SCHEDULES',
      DASHBOARD_SETUP_HEADER: 'DASHBOARD_SETUP_HEADER',
      DASHBOARD_SETUP: 'DASHBOARD_SETUP',
      USER_DASHBOARD_SETTINGS: 'USER_DASHBOARD_SETTINGS',
    };
  }

  mapArrFields(arr, mappingFields = {}, type) {
    return arr.map((field) => {
      if (!mappingFields[field]) {
        return type === 'insert' ? field : `${field} = ?`;
      }
      return type === 'insert'
        ? mappingFields[field]
        : `${mappingFields[field]} = ?`;
    });
  }

  mapObjFields(obj, mappingFields = {}, type) {
    const fields = Object.keys(obj);
    return fields.map((field) => {
      if (!mappingFields[field]) {
        return type === 'insert' ? field : `${field} = ${obj[field]}`;
      }
      return type === 'insert'
        ? mappingFields[field]
        : `${mappingFields[field]} = ${obj[field]}`;
    });
  }

  // Standard Functions
  insertQuery(table, mappingFields, fields) {
    const userContext = RequestContext.get();
    const userId = userContext.id
      ? convertPrettyStringToId(userContext.id)
      : null;

    let columnKeys;

    if (Array.isArray(fields)) {
      columnKeys = fields;
    } else if (fields !== null && typeof fields === 'object') {
      columnKeys = Object.keys(fields);
    } else {
      throw _Error(500, 'Fields must be an array or an object');
    }

    const columns = this.mapArrFields(columnKeys, mappingFields, 'insert');
    const placeholders = Array(columns.length).fill('?');

    if (userId) {
      columns.push('CREATED_BY');
      columns.push('MODIFIED_BY');
      placeholders.push(`'${userId}'`);
      placeholders.push(`'${userId}'`);
    }

    return `INSERT INTO ${this.tables[table]} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ID;`;
  }

  updateQuery(table, mappingFields, updateFields, whereFields) {
    const userContext = RequestContext.get();
    const userId = userContext.id
      ? convertPrettyStringToId(userContext.id)
      : null;

    let updateColumns;
    let whereColumns;

    if (Array.isArray(updateFields)) {
      updateColumns = this.mapArrFields(updateFields, mappingFields, 'update');
    } else if (updateFields !== null && typeof updateFields === 'object') {
      updateColumns = this.mapObjFields(updateFields, mappingFields, 'update');
    } else {
      throw _Error(500, 'Update Fields must be an array or an object');
    }

    if (Array.isArray(whereFields)) {
      whereColumns = this.mapArrFields(whereFields, mappingFields, 'update');
    } else if (whereFields !== null && typeof whereFields === 'object') {
      whereColumns = this.mapObjFields(whereFields, mappingFields, 'update');
    } else {
      throw _Error(500, 'Where Fields must be an array or an object');
    }

    if (userId) {
      const modifiedByColumn = this.mapObjFields(
        { MODIFIED_BY: `'${userId}'` },
        mappingFields,
        'update'
      );
      updateColumns = [...updateColumns, ...modifiedByColumn];
    }

    return `UPDATE ${this.tables[table]} SET ${updateColumns.join(', ')}
      WHERE ${whereColumns.join(' AND ')}`;
  }
}

export default DBQuery;
