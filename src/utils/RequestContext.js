'use strict';

import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * RequestContext
 *
 * Utility wrapper around AsyncLocalStorage to manage request-scoped contextual data throughout the application.
 * Provides methods to initialize, retrieve, and mutate context values during a request lifecycle.
 *
 * @namespace RequestContext
 */

const RequestContext = {
  // Initializes request context and executes callback within it.
  run: (data, callback) => asyncLocalStorage.run(data, callback),

  // Retrieves the current request context store.
  get: () => asyncLocalStorage.getStore(),

  // Sets a single value in the request context.
  set: (key, value) => {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store[key] = value;
    }
  },

  // Sets multiple values in the request context.
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
