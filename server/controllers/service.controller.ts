import sessionAuth from '../connections/firebase/middlewares/sessionAuth';
import { ControllerFactory } from './controller.interface';
import { MediaDocument } from '../models/MediaModel/find/findMediaDoc';
import { MultiMediaModel } from '../models/MediaModel/save/saveMediaDoc';
const debug = require('debug')('service-controller');

class ServiceController extends ControllerFactory {
  post = async (req, res) => {
    const document = new MultiMediaModel(req, res, this.model);

    const service = await document.save();

    return service;
  };

  get = async (req, res) => {
    const { id } = req.query;
    // JSON-Stream
    const model = new MediaDocument(req, res, this.model);
    await model.find({ parent: id });
    return null;
  };

  middlewares = [sessionAuth];
}

export default ServiceController;
