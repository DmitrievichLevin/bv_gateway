import { model } from 'mongoose';
import { HTTPError } from '../../../error/errorTypes';
import { AdminAuth } from '../fireAdmin';
import { UserSchema } from '../../../schemas/user.schema';
const debug = require('debug')('session-auth');

/**
 * Is Create User Request
 * @summary skip session auth
 * @param req
 * @returns {boolean}
 */
const isCreateUserRequest = (req) => {
  const { originalUrl, method } = req;
  return originalUrl === '/user' && method === 'PUT';
};

/**
 * Session Authentication via Firebase
 */
export default async (req, res, next) => {
  const _user_model = model('users', UserSchema);
  if (isCreateUserRequest(req)) {
    next();
  } else {
    // Get auth-token from request
    let token: string = req.headers?.['authorization'] ?? '';
    token = token.replace('Bearer ', '');
    debug(req.headers);
    await AdminAuth.verifyIdToken(token)
      .then((decoded) => {
        debug('\n decoded token', decoded?.email);
        return _user_model.findOne({ email: decoded.email });
      })
      .then((_u) => {
        req['authenticated_user'] = _u.toObject();
        next();
      })
      .catch((_) => {
        debug('Error authenticating user', _);
        req['authenticated_user'] = undefined;
        const err = new HTTPError('Must be logged in to do that.', 500);
        err.authError = true;
        next(err);
      });
  }
};
