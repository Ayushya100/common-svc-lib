'use strict';

import axios from 'axios';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { readFile } from 'fs/promises';
import helmet from 'helmet';
import * as OpenApiValidator from 'express-openapi-validator';
import os from 'os';
import path from 'path';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { logger } from '../utils/index.js';
import { infoLogger } from '../middlewares/index.js';
import { generalServiceConfig } from '../../constants.js';

const log = logger('service-configuration');

class Service {
  constructor(
    serviceConfig,
    cookieEnabled = false,
    openAPIEnabled = true,
    setUserContext = true
  ) {
    log.debug('Service constructor has been called');
    this.app = express();

    this.payloadSizeLimit = process.env.PAYLOAD_SIZE_LIMIT;
    this.originPath = process.env.ORIGIN_PATH;
    this.urlPayloadLimit = process.env.URL_PAYLOAD_LIMIT;
    this.apiRateLimit = Number(process.env.API_RATE_LIMIT) || 1000;
    this.windowSize = Number(process.env.WINDOW_SIZE) || 5 * 60 * 1000;
    this.cookieKey = process.env.COOKIE_KEY;

    this.serviceConfig = serviceConfig;
    this.cookieEnabled = cookieEnabled;
    this.openAPIEnabled = openAPIEnabled;
    this.setUserContext = setUserContext;

    const parentModulePath = process.argv[1];
    const appPath = path.dirname(parentModulePath);
    this.openAPISpec = path.join(appPath, 'openapi.yaml');

    this.initializeApp();
  }
}

Service.prototype.initializeApp = function () {
  log.debug('App middlewares initialization');

  // Payload Configuration
  this.app.use(
    express.json({
      limit: this.payloadSizeLimit || '1mb', // Maximum request payload size
    })
  );

  // Url Configuration
  this.app.use(
    express.urlencoded({
      limit: this.urlPayloadLimit || '64kb', // Maximum url-body size
      extended: false,
    })
  );

  // Helmet Configuration
  let hsts = {
    maxAge: 0,
  };

  if (process.env.NODE_ENV === 'production') {
    hsts = {
      maxAge: 31536000,
      preload: true,
    };
  }

  this.app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          baseUri: ["'self'"],
        },
      },
      crossOriginOpenerPolicy: {
        policy: 'same-origin',
      },
      crossOriginResourcePolicy: {
        policy: 'same-origin',
      },
      strictTransportSecurity: hsts,
      xContentTypeOptions: {
        policy: 'nosniff',
      },
    })
  );

  // Cors Configuration
  this.app.use(
    cors({
      origin: this.originPath,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Request-Id',
        'X-Correlation-Id',
        'X-Client-Id',
      ],
      maxAge: 300,
    })
  );

  // TODO - To be replaced later - Basic Rate limiter configuration
  this.app.use(
    rateLimit({
      windowMs: this.windowSize, // Window Size
      limit: this.apiRateLimit, // Limit each IP to the provided number of requests per window size
      message: 'Too many requests, please try again later',
    })
  );

  // Cookie Configuration
  if (this.cookieEnabled) {
    if (!this.cookieKey) {
      log.error('Cookie key not found');
      process.exit(1);
    }
    this.app.use(
      cookieParser({
        httpOnly: true,
        secure: true,
        maxAge: 2 * 60 * 60 * 1000,
        signed: this.cookieKey,
      })
    );
  }

  this.app.use(express.static('public'));

  this.app.use(infoLogger);
};

Service.prototype.initializeOpenAPI = async function () {
  log.debug('App openAPI validator middleware initialization');
  // Initialize OpenAPI Specs
  if (this.openAPIEnabled) {
    const openAPIFile = await readFile(this.openAPISpec, 'utf8');
    const apiSpec = yaml.parse(openAPIFile);

    // Service Swagger UI
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiSpec));
    this.app.use(
      OpenApiValidator.middleware({
        apiSpec: this.openAPISpec,
        validateRequests: true,
        validateResponses: true,
      })
    );
  }
};

Service.prototype.registerPublicEndpoints = function() {
  log.debug('Register service public end-points called');
}

Service.prototype.registerPrivateEndpoints = function() {
  log.debug('Register service private end-points');
}

Service.prototype.buildConnection = function () {
  log.debug('Service build connection initiated');
  if (!this.serviceConfig) {
    log.error('No service configuration provided');
    process.exit(1);
  }

  this.registerPublicEndpoints();
  this.registerPrivateEndpoints();

  const serviceName = this.serviceConfig.serviceName;
  const HOST = this.serviceConfig.HOST;
  const PORT = this.serviceConfig.PORT;
  const PROTOCOL = this.serviceConfig.PROTOCOL;

  this.app.listen(PORT, HOST, async () => {
    log.info(`[${serviceName}] Server is running on port : ${PORT}`);
    log.info(
      `Uptime : ${process.uptime()} seconds | Timestamp : ${Date.now()} | Hostname : ${os.hostname()}`
    );
    // TODO - Add register service configuration for updating the PORT and PROTOCOL of service name
  });
};

Service.prototype.testConnection = async function () {
  log.debug('Service connection test initiated');
  if (!this.serviceConfig) {
    log.error('No service configuration provided.');
    process.exit(1);
  }

  const serviceName = this.serviceConfig.serviceName;
  const HOST = this.serviceConfig.HOST;
  const PORT = this.serviceConfig.PORT;
  const PROTOCOL = this.serviceConfig.PROTOCOL;
  const timeout = generalServiceConfig.timeout;
  const retries = generalServiceConfig.retries;

  let response = null;
  let error = null;
  let retry = 0;

  while (retry < retries) {
    try {
      const API = `${PROTOCOL}://${HOST}:${PORT}/${serviceName}/api/v1.0/health`;
      response = await axios.get(API, {
        timeout: timeout,
      });
      break;
    } catch (err) {
      if (retry < retries) {
        log.error(`[${serviceName}] Health Check API call failed! Retrying...`);
      } else {
        log.error(`[${serviceName}] Health Check API call failed!`);
      }
      error = err;
      retry++;
    }
  }

  if (response) {
    log.info(
      `[${serviceName}] Health check for service succeeded. Status : ${response.status}`
    );
  } else {
    log.error(
      `[${serviceName}] Health check for service failed! Error : ${error}`
    );
  }
  throw new Error('Connection Failed!');
};

export default Service;
