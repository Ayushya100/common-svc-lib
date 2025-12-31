'use strict';

import jwt from 'jsonwebtoken';
import {
  _Error,
  convertPrettyStringToId,
  logger,
  RequestContext,
} from '../utils/index.js';
import { CoreDB } from '../db/index.js';

const log = logger('middleware: verify-token');

const verifyToken = async (req, res, next) => {
  try {
    log.info('Token verification operation initiated');
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      log.error('Token not received. Cannot proceed further!');
      next(_Error(400, 'User not authorized'));
    }

    const tokenKey = process.env.ACCESS_TOKEN_KEY;
    const refreshTokenKey = process.env.REFRESH_TOKEN_KEY;
    const decodedToken = jwt.verify(token, tokenKey);
    req.user = {
      id: decodedToken.id,
      username: decodedToken.username,
      role_code: decodedToken.role,
      scopes: decodedToken.scopes,
      isVerified: decodedToken.isVerified,
      isDeleted: decodedToken.isDeleted,
    };
    RequestContext.setList(req.user);

    const userId = convertPrettyStringToId(decodedToken.id);

    log.info('Verify if the user has an active refresh token');
    let refreshToken = await CoreDB.getUserRefreshToken(userId);
    refreshToken =
      refreshToken.rowCount === 1 ? refreshToken.rows[0].refresh_token : '';
    if (!refreshToken && !jwt.verify(refreshToken, refreshTokenKey)) {
      log.error('Token not valid');
      next(_Error(401, 'User authentication token expired'));
    }

    log.success('Token verification completed successfully');
    next();
  } catch (err) {
    log.error('Token invalid');
    next(_Error(401, 'User authentication token expired', err));
  }
};

export default verifyToken;
