import { model } from 'mongoose';
import { DefaultBusinessName } from '../schemas/presave/user.presave';
import { ControllerFactory, getByID } from './controller.interface';
import { VendorSchema } from '../schemas/vendor.schema';
import { SettingsSchema } from '../schemas/settings.schema';
import { v4 as uuidv4 } from 'uuid';
import {
  DependentDocument,
  InterDependentDocumentCreation,
} from '../schemas/presave/general.presave';
import sessionAuth from '../connections/firebase/middlewares/sessionAuth';
import { Auth } from '../connections/firebase/fireAdmin';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { HTTPError } from '../error/errorTypes';
import { ObjectId } from '../schemas/schemaTypes';

const { body } = require('express-validator');

const debug = require('debug')('child controller');

class UserController extends ControllerFactory {
  /**
   *
   * @param req
   * @param res
   * @summary - FailFast: Creates New User + (Vendor & Settings) Documents
   *
   */
  put = async (req, res) => {
    const {
      mike: email,
      wizowski: pword,
      location,
      phone,
      businessName = null,
      firstName,
      lastName,
    } = req.body;

    const newUserProps = {
      email,
      firstName,
      lastName,
      _id: new ObjectId(),
    };
    const existing = await this.model.findOne({ email });

    if (existing) {
      throw new HTTPError('User with email already exists.', 400);
    }

    const user = new this.model(newUserProps);

    const __vendorId = new ObjectId();

    let vendorDep: DependentDocument = {
      properties: {
        location,
        contact: { phone: phone.replace(/([\+\-])/g, '') },
        _id: __vendorId,
        name: businessName || DefaultBusinessName(firstName),
      },
      model: model('vendor', VendorSchema),
      path: 'vendor',
    };

    let settingsDep: DependentDocument = {
      properties: { _id: new ObjectId(), vendorId: __vendorId.toString() },
      model: model('settings', SettingsSchema),
      path: 'settings',
    };

    const createdUser = await InterDependentDocumentCreation(user, [
      vendorDep,
      settingsDep,
    ]);

    await createUserWithEmailAndPassword(Auth, email, pword)
      .then((cred: any) => cred.user.getIdToken())
      .then((token) => {
        const bearerToken = `Bearer ${token}`;
        res.set('authorization', bearerToken);
      })
      .catch(async (err) => {
        /**
         * Cleanup:
         * On Firebase Error Rollback Document(s) Creation
         */

        // Rollback user
        const { _id: newUserId } = newUserProps;
        await this.model.findOneAndDelete({ _id: newUserId });

        // Rollback vendor
        const {
          model: vendorModel,
          properties: { _id: vendorId },
        } = vendorDep;
        await vendorModel.findOneAndDelete({ _id: vendorId });

        // Rollback settings
        const {
          model: settingsModel,
          properties: { _id: settingsId },
        } = settingsDep;
        await settingsModel.findOneAndDelete({ _id: settingsId });

        // clear auth header
        res.set('authorization', '');
        throw new HTTPError(err.message, 409);
      });

    return createdUser;
  };

  get = async (req, _) => {
    const user = req.authenticated_user;

    return user;
  };

  middlewares = [sessionAuth];
}

export default UserController;
