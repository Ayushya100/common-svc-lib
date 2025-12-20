'use strict';

import winston from 'winston';

const customLevel = {
  levels: {
    error: 0,
    warning: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    success: 6,
  },
  colors: {
    error: 'red',
    warning: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    success: 'green',
  },
};

/*
 * Builds the transporter for logging.
 * @returns {array} - returns the transporter array.
 */

const buildTransporter = () => {
  if (process.env.NODE_ENV !== 'production') {
    return [
      new winston.transports.Console({
        level: 'success',
        handleExceptions: true,
        json: false,
        colorize: true,
      }),
    ];
  }

  return [
    new winston.transports.File({
      filename: 'src/logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'src/logs/app.log',
    }),
  ];
};

/*
 * Builds the format for logging.
 * @param {string} label - the label for the logger.
 * @returns {object} - returns the format object.
 */

const buildFormat = (label) => {
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.prettyPrint(),
    winston.format.colorize({ all: true }),
    winston.format.label({ label: label }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      return `${info.timestamp} - ${info.level} [${info.label}] : ${info.message}`;
    })
  );
};

/*
 * Builds the logger.
 * @param {string} label - the label for the logger.
 * @returns {object} - returns the logger object.
 */

const logger = (label = '') => {
  const format = buildFormat(label);
  const transport = buildTransporter();
  winston.addColors(customLevel.colors);

  return winston.createLogger({
    levels: customLevel.levels,
    level: 'success',
    format: format,
    transports: transport,
  });
};

export default logger;
