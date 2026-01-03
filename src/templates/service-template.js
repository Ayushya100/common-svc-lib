'use strict';

import axios from 'axios';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import * as OpenApiValidator from 'express-openapi-validator';
import os from 'os';
import path from 'path';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { logger } from '../utils/index.js';
import {
  infoLogger,
  requestContextMiddleware,
  errorHandler,
  verifyToken,
  correlationMiddleware,
  sessionMiddleware,
} from '../middlewares/index.js';
import { generalServiceConfig } from '../../constants.js';
import { initializeI18n } from '../utils/index.js';

const log = logger('service-configuration');

/**
 * Service class responsible for initializing and running an Express-based HTTP service with security, middleware,
 * OpenAPI validation, and lifecycle management.
 *
 * @class Service
 *
 * @param {Object} serviceConfig - Configuration object containing service metadata and network details.
 * @param {boolean} [cookieEnabled=false] - Enables cookie parsing and signed cookies if true.
 * @param {boolean} [openAPIEnabled=true] - Enables OpenAPI validation and Swagger UI if true.
 * @param {boolean} [setUserContext=true] - Enables request-scoped user context middleware if true.
 * @property {Object} app - Express application instance.
 * @property {Object} serviceConfig - Service configuration object.
 * @property {boolean} cookieEnabled - Indicates whether cookies are enabled.
 * @property {boolean} openAPIEnabled - Indicates whether OpenAPI validation is enabled.
 * @property {boolean} setUserContext - Indicates whether user context middleware is enabled.
 */

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
    this.initializeOpenAPI();
  }
}

/**
 * Initializes core Express middlewares including payload limits, security headers, CORS, rate limiting, cookies, compression, static assets, and logging.
 *
 * @function initializeApp
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Configures and registers global application middleware.
 */

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

  // Compression Configuration
  this.app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

  this.app.use(express.static('public'));

  this.app.use(infoLogger);
};

/**
 * Initializes OpenAPI specification validation and Swagger UI.
 *
 * @function initializeOpenAPI
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Registers OpenAPI request/response validators and exposes Swagger documentation if enabled.
 */

Service.prototype.initializeOpenAPI = function () {
  log.debug('App openAPI validator middleware initialization');
  // Initialize OpenAPI Specs
  if (this.openAPIEnabled) {
    const openAPIFile = readFileSync(this.openAPISpec, 'utf8');
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

/**
 * Registers middleware to attach a correlation ID to incoming requests.
 *
 * @function setCorrelationId
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Adds correlation ID middleware to the application.
 */

Service.prototype.setCorrelationId = function () {
  log.debug('Set correlation id to the request middleware initiated');
  this.app.use(correlationMiddleware);
};

/**
 * Registers middleware to attach a session ID to incoming requests.
 *
 * @function setSessionId
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Adds session ID middleware to the application.
 */

Service.prototype.setSessionId = function () {
  log.debug('Set session id to the request middleware initiated');
  this.app.use(sessionMiddleware);
};

/**
 * Registers request-scoped user context middleware if enabled via configuration.
 *
 * @function setUserContextFn
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Adds user context middleware when enabled.
 */

Service.prototype.setUserContextFn = function () {
  if (this.setUserContext) {
    log.debug('App user context middleware initialized');
    this.app.use(requestContextMiddleware);
  }
};

/**
 * Registers publicly accessible service endpoints.
 *
 * @function registerPublicEndpoints
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Intended to be overridden by implementing services.
 */

Service.prototype.registerPublicEndpoints = function () {
  log.debug('Register service public end-points called');
};

/**
 * Registers authentication token verification middleware.
 *
 * @function setTokenVerification
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Adds token verification middleware to the application.
 */

Service.prototype.setTokenVerification = function () {
  log.debug('Verification token middleware initialization');
  this.app.use(verifyToken);
};

/**
 * Registers protected (authenticated) service endpoints.
 *
 * @function registerPrivateEndpoints
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Intended to be overridden by implementing services.
 */

Service.prototype.registerPrivateEndpoints = function () {
  log.debug('Register service private end-points');
};

/**
 * Registers the global error handling middleware.
 *
 * @function registerErrorHandler
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Adds centralized error handling middleware.
 */

Service.prototype.registerErrorHandler = function () {
  log.debug('Global error handler middleware initialized');
  this.app.use(errorHandler);
};

/**
 * Builds and starts the HTTP server, registers all middleware, initializes localization, and handles graceful shutdown.
 *
 * @function buildConnection
 *
 * @memberof Service.prototype
 *
 * @returns {void} - Starts the server and attaches process-level shutdown handlers.
 * @throws {Error} - Terminates the process if service configuration is missing.
 */

Service.prototype.buildConnection = function () {
  log.debug('Service build connection initiated');
  if (!this.serviceConfig) {
    log.error('No service configuration provided');
    process.exit(1);
  }

  this.setCorrelationId();
  this.setSessionId();
  this.setUserContextFn();
  initializeI18n();
  this.registerPublicEndpoints();
  this.setTokenVerification();
  this.registerPrivateEndpoints();
  this.registerErrorHandler();

  const serviceName = this.serviceConfig.serviceName;
  const HOST = this.serviceConfig.HOST;
  const PORT = this.serviceConfig.PORT;
  const PROTOCOL = this.serviceConfig.PROTOCOL;

  const server = this.app.listen(PORT, HOST, async () => {
    log.info(`[${serviceName}] Server is running on port : ${PORT}`);
    log.info(
      `Uptime : ${process.uptime()} seconds | Timestamp : ${Date.now()} | Hostname : ${os.hostname()}`
    );
    // TODO - Add register service configuration for updating the PORT and PROTOCOL of service name
  });

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('uncaughtException', shutdown);
  process.on('unhandledRejection', shutdown);

  function shutdown() {
    log.error('Shutting down server...');
    server.close(() => {
      log.success('Server closed');
      process.exit(0);
    });
  }
};

/**
 * Tests connectivity to the running service by invoking its health check endpoint with retry logic.
 *
 * @function testConnection
 *
 * @memberof Service.prototype
 *
 * @returns {Promise<void>} - Resolves when the service responds successfully.
 * @throws {Error} - Thrown when the health check fails after all retries.
 */

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
    throw new Error('Connection Failed!');
  }
};

export default Service;
