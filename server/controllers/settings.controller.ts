import { ControllerFactory, getByID } from './controller.interface';

const debug = require('debug')('child controller');

class SettingsController extends ControllerFactory {
  post = async (req, _) => {
    const { id, ...update } = req.body;
    const opts = { runValidators: true, new: true };

    const data = await this.model
      .findOneAndUpdate({ id }, update, opts)
      .then((data) => data);

    return data;
  };

  getById = getByID;
}

export default SettingsController;
