'use strict';

import dotenv from 'dotenv';

import { Service } from './src/templates/index.js';
import { infoLogger } from './src/middlewares/index.js';
import { logger } from './src/utils/index.js';

dotenv.config({
    path: './env'
});

export {
    Service,
    logger
};
