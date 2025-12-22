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
};

export default RequestContext;
