import { model } from 'mongoose';
import { ControllerFactory } from './controller.interface';
import { VendorSchema } from '../schemas/vendor.schema';
import { SettingsSchema } from '../schemas/settings.schema';
import { FindRelations } from '../schemas/presave/general.presave';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Auth } from '../connections/firebase/fireAdmin';

const debug = require('debug')('child controller');

const signInMiddleware = async (req, res, next) => {
  const { email, pword: password } = req.body;

  /**
   * @todo - see link (https://stackoverflow.com/questions/34589272/how-to-set-authorization-headers-with-nodejs-and-express)
   */
  debug('hitting middleware');
  signInWithEmailAndPassword(Auth, email, password)
    .then((result) => result.user.getIdToken())
    .then((token) => {
      const bearerToken = `Bearer ${token}`;
      /**
       * @todo One or Both
       */
      res.set('authorization', bearerToken);
      // res.cookie('token', token, {
      //   maxAge: 3600,
      //   httpOnly: true,
      //   sameSite: isProd ? 'strict' : 'lax',
      //   secure: true,
      // });
      next();
    })
    .catch(function (error) {
      // Handle error.
      next(error);
      debug('Unable to authenticate user.', error);
    });
};

class LoginController extends ControllerFactory {
  /**
   * User Signin
   * @param req
   * @param res
   * @returns
   */
  post = async (req, _) => {
    const { email } = req.body;
    debug('sign-in-post', req.body);
    const foundUser = await this.model.findOne({ email });

    if (foundUser) {
      return foundUser;
    }
    return null;
  };

  middlewares = [signInMiddleware];
}

export default LoginController;
