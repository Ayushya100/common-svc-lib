'use strict';

import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

const RequestContext = {
  run: (data, callback) => asyncLocalStorage.run(data, callback),
  get: () => asyncLocalStorage.getStore(),
  set: (key, value) => {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store[key] = value;
    }
  },
  setList: (list) => {
    const store = asyncLocalStorage.getStore();
    if (store) {
      for (const [key, value] of Object.entries(list)) {
        store[key] = value;
      }
    }
  },
};

export default RequestContext;
