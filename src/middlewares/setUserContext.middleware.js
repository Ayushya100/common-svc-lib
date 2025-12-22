'use strict';

import { RequestContext } from '../utils/index.js';

const requestContextMiddleware = (req, res, next) => {
  const userData = {
    locale: req.headers['x-lang'] || 'en-US',
  };

  RequestContext.run(userData, () => {
    next();
  });
};

export default requestContextMiddleware;
