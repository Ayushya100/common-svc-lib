'use strict';

import fs from 'fs';
import i18n from 'i18n';
import path from 'path';
import logger from './logger.js';
import RequestContext from './RequestContext.js';

const log = logger('util: localize');

function initializeI18n() {
  const localePath = path.resolve(process.cwd(), 'src/assets/i18n');
  if (!fs.existsSync(localePath)) {
    throw new Error(`i18n locales folder not found: ${localePath}`);
  }

  const options = {
    directory: localePath,
    defaultLocale: 'en-US',
    locales: ['en-US'],
    autoReload: false,
    updateFiles: false,
    syncFiles: false,
  };
  i18n.configure(options);
  log.debug(`i18n has been configured with options`);
}

function translate(message, locale = 'en-US') {
  const userContext = RequestContext.get();
  locale = userContext?.locale || locale;

  if (i18n.getLocale(locale)) {
    return i18n.__({ phrase: message, locale: locale });
  }
  return message;
}

export { initializeI18n, translate };
