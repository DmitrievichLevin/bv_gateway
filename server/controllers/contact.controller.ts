import {
  ControllerFactory,
  DisabledHTTP,
  EnabledHTTP,
} from './controller.interface';
import { v4 as uuidv4 } from 'uuid';
import sessionAuth from '../connections/firebase/middlewares/sessionAuth';
import { later } from '../routes/helpers/misc';
import { applyPatch } from 'fast-json-patch';
import { model } from 'mongoose';
import { UserSchema } from '../schemas/user.schema';

const debug = require('debug')('contact-controller');

class ContactController extends ControllerFactory {
  patch = async (req, _) => {
    const { id, patch, auth = null } = req.body;

    let userId: any = 'bash_master';

    if (auth) {
      // Get SenderId
      let User = model('user', UserSchema);

      userId = await User.findOne({ email: auth.email });

      userId = userId.toObject().id;
    }

    const patched = await this.model.findOne({ id }).then((doc) => {
      if (doc) {
        applyPatch(doc, patch).newDocument;
        doc.save().then(() => {
          this.rpc.send(`update_client:${userId}`);
        });
        return doc;
      } else {
        throw new Error(`Document to be patched, not found id: ${id}`);
      }
    });

    return patched;
  };

  put = async (req, res) => {
    const { fname, lname, phone, email } = req.body;

    const defaultId = uuidv4();
    const contact = new this.model({
      fname,
      lname,
      phone,
      email,
      id: defaultId,
    });

    const data = await contact.save();

    /**
     * Simulate Server Load
     */
    await later(20000);

    return data;
  };

  get = async (req, _) => {
    const contacts = await this.model.find({});

    // Return Hashmap of contacts for client
    return contacts.reduce((dict, item) => {
      dict[item.id] = item;
      return dict;
    }, {});
  };

  delete = async (req, _) => {
    const { id } = req.query;
    const removed = await this.model.findOneAndDelete({ id });

    if (removed) {
      return removed;
    } else {
      throw new Error('Unable to delete, Document not found.');
    }
  };

  middlewares = [sessionAuth];
}

export default ContactController;
